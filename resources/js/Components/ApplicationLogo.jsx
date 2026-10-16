/*
 * ReliefNet mark — shield (barangay protection) holding a map pin
 * (incidents located live) with an amber heart (relief with care).
 * Same artwork as public/images/logo.svg, inlined for crisp rendering.
 */
export default function ApplicationLogo(props) {
    return (
        <svg
            {...props}
            viewBox="0 0 64 64"
            xmlns="http://www.w3.org/2000/svg"
            role="img"
            aria-label="ReliefNet"
        >
            <defs>
                <linearGradient id="rn-shield" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#1E88E5" />
                    <stop offset="1" stopColor="#0D47A1" />
                </linearGradient>
            </defs>
            <path d="M32 3 55 11v17c0 14.5-9.6 26.3-23 33C18.6 54.3 9 42.5 9 28V11Z" fill="url(#rn-shield)" />
            <path d="M32 7.2 51 13.9v14.1c0 12.3-8 22.6-19 28.6-11-6-19-16.3-19-28.6V13.9Z" fill="#1565C0" />
            <path d="M32 13c-7.4 0-13.4 6-13.4 13.4C18.6 36.6 32 49 32 49s13.4-12.4 13.4-22.6C45.4 19 39.4 13 32 13Z" fill="#FFFFFF" />
            <path d="M32 34.6s-7.4-4.7-7.4-9.8c0-2.6 2-4.6 4.5-4.6 1.6 0 2.4.7 2.9 1.5.5-.8 1.3-1.5 2.9-1.5 2.5 0 4.5 2 4.5 4.6 0 5.1-7.4 9.8-7.4 9.8Z" fill="#FF8F00" />
        </svg>
    );
}
