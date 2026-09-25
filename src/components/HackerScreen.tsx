"use client";

export default function HackerScreen() {
  return (
    <div className="hacker-screen">
      <img src="/hacked.png" alt="NOVA Academy Security Challenge" />
      <style jsx>{`
        .hacker-screen {
          position: fixed;
          inset: 0;
          width: 100vw;
          height: 100dvh;
          background: #000;
          z-index: 999999;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .hacker-screen img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
      `}</style>
    </div>
  );
}
