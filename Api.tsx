/**
 * Api — everything that talks to the network, and nothing that renders.
 *
 * Imports nothing, so it can be read, tested or reused on its own.
 */

const BASE_URL = "https://syncsphere-hiv6.onrender.com"
const COURSES_URL = `${BASE_URL}/assignment/course-data`
const COUNTRY_URL = `${BASE_URL}/assignment/country-code`

// The API returns a 404 or 500 on roughly 1 in 3 calls, on purpose. One
// automatic retry drops that to ~1 in 9 without pretending the API is
// healthy: after MAX_ATTEMPTS we stop and show the error state, which the
// visitor can retry by hand. Retrying forever would turn a dead API into a
// spinner that never resolves.
const MAX_ATTEMPTS = 2
const RETRY_BASE_MS = 400

// This API is on a free tier that cold-starts. A socket that opens and then
// hangs would otherwise leave the skeletons up forever, so every attempt gets
// its own deadline. A timeout is retried like any other failure.
const TIMEOUT_MS = 8000

/**
 * Exponential backoff with full jitter: attempt n waits a random slice of
 * [0, BASE * 2^(n-1)].
 *
 * At MAX_ATTEMPTS = 2 there is exactly one wait, so the exponent buys nothing
 * today — it only matters if the budget is ever raised. The jitter does earn
 * its keep now: this API is on a free tier that cold-starts, and a cold start
 * releases every waiting visitor at the same instant. A fixed delay would send
 * them all back in lockstep; a random one spreads them out.
 */
function backoffDelay(attempt) {
    return Math.random() * RETRY_BASE_MS * Math.pow(2, attempt - 1)
}

/* --------------------------- country, remembered --------------------------- */

const COUNTRY_CACHE_KEY = "skillpath:country"

/**
 * The country endpoint flips between IN and US on purpose, but a visitor does
 * not move between countries mid-session. Remembering the first answer for the
 * tab means a reload doesn't re-roll a 1-in-3 failure on a value that cannot
 * meaningfully change, and the price stops flickering between currencies.
 *
 * sessionStorage rather than localStorage so a fresh tab still gets a fresh
 * roll — useful when someone wants to see both currencies. Every access is
 * guarded: it is absent during Framer's prerender and throws outright in some
 * privacy modes.
 */
function readCachedCountry() {
    try {
        if (typeof sessionStorage === "undefined") return null
        const value = sessionStorage.getItem(COUNTRY_CACHE_KEY)
        return value === "IN" || value === "US" ? value : null
    } catch (error) {
        return null
    }
}

function cacheCountry(code) {
    try {
        if (typeof sessionStorage === "undefined") return
        sessionStorage.setItem(COUNTRY_CACHE_KEY, code)
    } catch (error) {
        // A full or disabled store is not a reason to fail the request.
    }
}

/**
 * The caller's abort signal, plus a per-attempt deadline.
 *
 * AbortSignal.any and AbortSignal.timeout are recent; where they are missing
 * we simply lose the deadline rather than the request.
 */
function withDeadline(signal) {
    if (
        typeof AbortSignal === "undefined" ||
        typeof AbortSignal.any !== "function" ||
        typeof AbortSignal.timeout !== "function"
    ) {
        return signal
    }
    return AbortSignal.any([signal, AbortSignal.timeout(TIMEOUT_MS)])
}

/** setTimeout that gives up if the component unmounts mid-wait. */
function wait(ms, signal) {
    return new Promise((resolve, reject) => {
        // An already-aborted signal never fires "abort" again, so the
        // listener below would never run and this would resolve instead.
        if (signal.aborted) {
            reject(new Error("aborted"))
            return
        }

        const timer = setTimeout(resolve, ms)
        signal.addEventListener(
            "abort",
            () => {
                clearTimeout(timer)
                reject(new Error("aborted"))
            },
            { once: true }
        )
    })
}

/**
 * A bare GET. No method, no headers, no body.
 *
 * Anything beyond a "simple request" makes the browser send a CORS preflight
 * OPTIONS of its own before the GET. This API answers 405 to everything that
 * isn't a GET, so the preflight fails and the GET is never sent — which is
 * what the brief's "everything else returns a 405" line is pointing at. The
 * usual way to trip it is a Content-Type header.
 */
async function getJson(url, signal) {
    let response
    try {
        response = await fetch(url, { signal: withDeadline(signal) })
    } catch (error) {
        // The deadline aborts the fetch; say that plainly instead of
        // surfacing "signal is aborted without reason".
        if (error && error.name === "TimeoutError") {
            throw new Error(`Request timed out after ${TIMEOUT_MS / 1000}s`)
        }
        throw error
    }

    if (!response.ok) {
        throw new Error(`Request failed with ${response.status}`)
    }
    return response.json()
}

async function getJsonWithRetry(url, signal) {
    let lastError

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        try {
            return await getJson(url, signal)
        } catch (error) {
            // An abort is the caller leaving, not a failure worth retrying.
            if (signal.aborted) throw error
            lastError = error
            if (attempt < MAX_ATTEMPTS) await wait(backoffDelay(attempt), signal)
        }
    }

    throw lastError
}

/** Resolves to an array, always — the shape is trusted only as far as checked. */
export function fetchCourses(signal) {
    return getJsonWithRetry(COURSES_URL, signal).then((data) =>
        Array.isArray(data) ? data : []
    )
}

/**
 * Resolves to "IN" or "US". Anything else is treated as "IN".
 *
 * Answers from the session cache when we already know. Only successes are
 * cached — a failure has to stay retryable, or one unlucky load would price
 * the whole session on a fallback.
 */
export function fetchCountry(signal) {
    const cached = readCachedCountry()
    if (cached) return Promise.resolve(cached)

    return getJsonWithRetry(COUNTRY_URL, signal).then((data) => {
        const code = data && data.country_code === "US" ? "US" : "IN"
        cacheCountry(code)
        return code
    })
}
