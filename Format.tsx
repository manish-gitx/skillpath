/**
 * Format — price formatting and the filter/sort pass. Pure functions, no
 * React, no imports.
 */

/**
 * Both price fields are integers in the currency's *minor* unit:
 * 199900 paise is Rs 1,999.00 and 3999 cents is $39.99. Everything divides
 * by 100 before it is formatted — the single most important line here.
 */
function priceInMinorUnits(course, country) {
    const value = country === "IN" ? course.pricePaise : course.priceUsdCents
    return typeof value === "number" && Number.isFinite(value) ? value : NaN
}

export function formatPrice(course, country) {
    const minorUnits = priceInMinorUnits(course, country)
    if (Number.isNaN(minorUnits)) return "—"

    // en-IN gives the lakh grouping (Rs 1,99,900) that an Indian learner
    // expects; whole rupees read better without ".00", dollars keep cents.
    const isIndia = country === "IN"
    const digits = isIndia && minorUnits % 100 === 0 ? 0 : 2

    return new Intl.NumberFormat(isIndia ? "en-IN" : "en-US", {
        style: "currency",
        currency: isIndia ? "INR" : "USD",
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
    }).format(minorUnits / 100)
}

/**
 * Filters by a free-text query, then sorts on the currency actually shown so
 * the order on screen always matches the numbers on screen.
 *
 * sortOrder is "default" | "asc" | "desc".
 */
export function selectCourses(courses, { query, sortOrder, country }) {
    const needle = String(query ?? "").trim().toLowerCase()

    let list = courses
    if (needle) {
        list = list.filter((course) =>
            [course.courseName, course.mainCategory, course.description]
                .filter(Boolean)
                .some((field) => String(field).toLowerCase().includes(needle))
        )
    }

    if (sortOrder === "asc" || sortOrder === "desc") {
        const direction = sortOrder === "asc" ? 1 : -1
        list = [...list].sort((a, b) => {
            const left = priceInMinorUnits(a, country)
            const right = priceInMinorUnits(b, country)

            // A course with an unusable price renders "—". Returning NaN from
            // a comparator makes sort() produce an arbitrary order, so those
            // are parked at the end in both directions instead.
            const leftMissing = Number.isNaN(left)
            const rightMissing = Number.isNaN(right)
            if (leftMissing || rightMissing) {
                if (leftMissing && rightMissing) return 0
                return leftMissing ? 1 : -1
            }

            return (left - right) * direction
        })
    }

    return list
}

/* ------------------------------- extra field ------------------------------- */

/**
 * Which payload field rides on the card as a chip, offered as a menu.
 *
 * courseCode and mangoId are deliberately absent: no learner scans for a slug
 * or a database id, so putting them in the menu would only invite a bad
 * choice. Category is the default because it is what someone browsing a
 * catalogue actually sorts the world by.
 */
export const EXTRA_FIELDS = {
    category: { title: "Category", key: "mainCategory" },
    type: { title: "Course type", key: "courseType" },
    topic: { title: "Short name", key: "shortCourse" },
    none: { title: "None", key: null },
}

export const EXTRA_FIELD_KEYS = Object.keys(EXTRA_FIELDS)

export const EXTRA_FIELD_TITLES = EXTRA_FIELD_KEYS.map(
    (key) => EXTRA_FIELDS[key].title
)

/** The chosen field's value, or "" when it is missing or set to None. */
export function extraFieldValue(course, choice) {
    const field = EXTRA_FIELDS[choice] || EXTRA_FIELDS.category
    if (!field.key) return ""
    const value = course[field.key]
    return typeof value === "string" ? value : ""
}
