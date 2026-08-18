/**
 * Ui — presentational building blocks. Every one of these takes data and
 * renders; none of them fetch, measure or own state. That split is what makes
 * the section easy to restyle without touching the data code.
 *
 * Text colours arrive as CSS custom properties from the section root rather
 * than as props — see TEXT_VAR / MUTED_VAR in Tokens.tsx.
 */

import {
    ACCENT,
    GLOBAL_CSS,
    MUTED_VAR,
    TEXT_VAR,
    contrastText,
    theme,
    tint,
} from "./Tokens.tsx"
import { formatPrice } from "./Format.tsx"

/** One <style> tag carrying the rules inline styles can't express. */
export function StyleSheet() {
    return <style>{GLOBAL_CSS}</style>
}

/* ---------------------------------- atoms ---------------------------------- */

function Chip({ label, color }) {
    return (
        <span
            style={{
                fontSize: 12,
                fontWeight: 500,
                lineHeight: 1.4,
                color,
                background: tint(color, 0.12),
                border: `1px solid ${tint(color, 0.28)}`,
                borderRadius: 999,
                padding: "4px 10px",
                whiteSpace: "nowrap",
            }}
        >
            {label}
        </span>
    )
}

function PrimaryButton({ onClick, children }) {
    return (
        <button
            type="button"
            className="sp-focusable"
            onClick={onClick}
            style={{
                marginTop: 4,
                padding: "10px 20px",
                borderRadius: 10,
                border: "none",
                background: ACCENT,
                // Ink on a bright accent, white on a dark one — measured, so
                // changing ACCENT in Tokens.tsx can't leave an unreadable label.
                color: contrastText(ACCENT),
                fontSize: 14,
                fontWeight: 600,
                fontFamily: "inherit",
                cursor: "pointer",
            }}
        >
            {children}
        </button>
    )
}

/* --------------------------------- toolbar --------------------------------- */

const fieldStyle = {
    padding: "10px 14px",
    borderRadius: 10,
    border: `1px solid ${theme.border}`,
    background: theme.surface,
    color: TEXT_VAR,
    fontSize: 14,
    fontFamily: "inherit",
}

export function Toolbar({ query, onQuery, sortOrder, onSort, disabled }) {
    return (
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <input
                className="sp-focusable"
                type="search"
                value={query}
                onChange={(event) => onQuery(event.target.value)}
                placeholder="Search courses"
                aria-label="Search courses"
                disabled={disabled}
                style={{ ...fieldStyle, width: 200 }}
            />
            <select
                className="sp-focusable"
                value={sortOrder}
                onChange={(event) => onSort(event.target.value)}
                aria-label="Sort courses"
                disabled={disabled}
                style={fieldStyle}
            >
                <option value="default">Sort: featured</option>
                <option value="asc">Price: low to high</option>
                <option value="desc">Price: high to low</option>
            </select>
        </div>
    )
}

/* ----------------------------------- card ---------------------------------- */

function CourseCard({ course, country, priceReady, card }) {
    return (
        <article
            className="sp-card"
            style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
                padding: card.padding,
                borderRadius: card.radius,
                background: theme.surface,
                // Width and style inline, colour via the custom property: a
                // style-attribute declaration outranks any author rule, so an
                // inline border-color would make :hover impossible to apply.
                borderWidth: 1,
                borderStyle: "solid",
                "--sp-card-border": theme.border,
                minWidth: 0,
            }}
        >
            <div
                style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 8,
                    alignItems: "center",
                }}
            >
                {/* The extra field the brief asks for. Category is the one a
                    learner actually scans for; courseCode and mangoId are
                    internal identifiers and deliberately absent. */}
                <Chip label={course.mainCategory || "Course"} color={ACCENT} />
                {course.refundable === true && (
                    <Chip label="Refundable" color={theme.positive} />
                )}
            </div>

            <h3
                style={{
                    margin: 0,
                    fontSize: 18,
                    lineHeight: 1.3,
                    fontWeight: 600,
                    color: TEXT_VAR,
                }}
            >
                {course.courseName}
            </h3>

            <p
                style={{
                    margin: 0,
                    fontSize: 14,
                    lineHeight: 1.55,
                    color: MUTED_VAR,
                    // Two lines, cut with an ellipsis rather than a hard crop.
                    display: "-webkit-box",
                    WebkitBoxOrient: "vertical",
                    WebkitLineClamp: 2,
                    overflow: "hidden",
                }}
            >
                {course.description}
            </p>

            <div
                style={{
                    marginTop: "auto",
                    paddingTop: 14,
                    borderTop: `1px solid ${theme.border}`,
                    display: "flex",
                    alignItems: "baseline",
                    gap: 8,
                }}
            >
                {/* Until the country lookup settles the currency is unknown,
                    so hold the number back rather than print one we may have
                    to swap a moment later. */}
                {priceReady ? (
                    <span
                        style={{ fontSize: 20, fontWeight: 600, color: TEXT_VAR }}
                    >
                        {formatPrice(course, country)}
                    </span>
                ) : (
                    <span
                        className="sp-skeleton"
                        aria-hidden="true"
                        style={{ display: "inline-block", width: "5ch", height: 20 }}
                    />
                )}
                <span style={{ fontSize: 12, color: MUTED_VAR }}>one-time</span>
            </div>
        </article>
    )
}

export function CourseGrid({ courses, columns, gap, country, priceReady, card }) {
    return (
        <div
            style={{
                display: "grid",
                gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                gap,
            }}
        >
            {courses.map((course, index) => (
                <CourseCard
                    // courseCode is the stable id in the payload; index is
                    // only ever the last resort.
                    key={course.courseCode || course.mangoId || index}
                    course={course}
                    country={country}
                    priceReady={priceReady}
                    card={card}
                />
            ))}
        </div>
    )
}

/* ---------------------------------- states --------------------------------- */

export function SkeletonGrid({ columns, count, gap, card }) {
    const bars = [96, "70%", "100%", "85%"]

    return (
        <div
            aria-hidden="true"
            style={{
                display: "grid",
                gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                gap,
            }}
        >
            {Array.from({ length: count }).map((_, cardIndex) => (
                <div
                    key={cardIndex}
                    style={{
                        padding: card.padding,
                        borderRadius: card.radius,
                        background: theme.surface,
                        border: `1px solid ${theme.border}`,
                        display: "flex",
                        flexDirection: "column",
                        gap: 12,
                    }}
                >
                    {bars.map((width, barIndex) => (
                        <div
                            key={barIndex}
                            className="sp-skeleton"
                            style={{ width, height: barIndex < 2 ? 21 : 14 }}
                        />
                    ))}
                    <div
                        className="sp-skeleton"
                        style={{ width: 90, height: 22, marginTop: 14 }}
                    />
                </div>
            ))}
        </div>
    )
}

function StateBox({ children }) {
    return (
        <div
            role="status"
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                textAlign: "center",
                padding: "64px 24px",
                borderRadius: 16,
                background: theme.surface,
                border: `1px dashed ${theme.borderStrong}`,
                color: TEXT_VAR,
            }}
        >
            {children}
        </div>
    )
}

export function ErrorState({ detail, onRetry }) {
    return (
        <StateBox>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
                We couldn't load the courses
            </h3>
            <p style={{ margin: 0, fontSize: 14, color: MUTED_VAR }}>
                The course service didn't answer. Nothing is wrong on your end.
            </p>
            <PrimaryButton onClick={onRetry}>Try again</PrimaryButton>
            {/* The status code helps whoever debugs this; it is not the headline. */}
            {detail ? (
                <span style={{ fontSize: 12, color: MUTED_VAR, opacity: 0.7 }}>
                    {detail}
                </span>
            ) : null}
        </StateBox>
    )
}

export function EmptyState({ isFiltered, query, onClear, onRetry }) {
    // "Your search matched nothing" and "the catalogue is empty" are different
    // problems, so they get different words and a different button. The API
    // never returns zero courses, so the filtered case is the only one a
    // visitor can actually reach.
    return (
        <StateBox>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
                {isFiltered
                    ? `No courses match "${query.trim()}"`
                    : "No courses yet"}
            </h3>
            <p style={{ margin: 0, fontSize: 14, color: MUTED_VAR }}>
                {isFiltered
                    ? "Try a shorter word, or clear the search to see everything."
                    : "The catalogue came back empty. Check again in a moment."}
            </p>
            <PrimaryButton onClick={isFiltered ? onClear : onRetry}>
                {isFiltered ? "Clear search" : "Reload"}
            </PrimaryButton>
        </StateBox>
    )
}
