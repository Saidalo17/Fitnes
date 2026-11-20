"use client";

// Последняя линия обороны: ошибка в корневом layout (провайдеров здесь нет, поэтому текст двуязычный).
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="ru">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          background: "#faf7f4",
          color: "#1a1412",
          minHeight: "100dvh",
          display: "grid",
          placeItems: "center",
          textAlign: "center",
          padding: 16,
        }}
      >
        <div>
          <h1 style={{ fontSize: 28, marginBottom: 8 }}>
            Что-то пошло не так / Something went wrong
          </h1>
          <button
            onClick={reset}
            style={{
              height: 48,
              padding: "0 24px",
              borderRadius: 8,
              border: 0,
              background: "#e8450a",
              color: "#fff",
              fontWeight: 600,
              fontSize: 16,
              cursor: "pointer",
            }}
          >
            Повторить / Try again
          </button>
        </div>
      </body>
    </html>
  );
}
