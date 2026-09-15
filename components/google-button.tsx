"use client";

export function GoogleButton({ label }: { label?: string }) {
  return (
    <a
      href="/api/auth/google"
      className="btn btn-ghost w-full"
      aria-label="Continue with Google"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="#4285F4"
          d="M23.5 12.3c0-.9-.1-1.5-.3-2.2H12v4.1h6.5c-.1 1.1-.8 2.7-2.4 3.8l3.7 2.9c2.3-2.1 3.7-5.1 3.7-8.6z"
        />
        <path
          fill="#34A853"
          d="M12 24c3.2 0 6-1.1 8-2.9l-3.7-2.9c-1 .7-2.4 1.2-4.3 1.2-3.3 0-6.1-2.2-7.1-5.2L1 17.1C3 21.1 7.2 24 12 24z"
        />
        <path
          fill="#FBBC05"
          d="M4.9 14.2c-.2-.7-.4-1.4-.4-2.2s.1-1.5.4-2.2L1 6.9C.4 8.4 0 10.2 0 12s.4 3.6 1 5.1l3.9-2.9z"
        />
        <path
          fill="#EA4335"
          d="M12 4.8c1.8 0 3 .8 3.7 1.4l3.2-3.1C17 1.2 15.2.4 12 .4 7.2.4 3 3.3 1 6.9l3.9 2.9c1-2.9 3.8-5 7.1-5z"
        />
      </svg>
      {label ?? "Continue with Google"}
    </a>
  );
}
