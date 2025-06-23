export default function BubbleBackground() {
  const bubbleCount = 30;

  const bubbles = Array.from({ length: bubbleCount }, (_, i) => {
    const size = Math.random() * 40 + 10; // 10px to 50px
    const left = Math.random() * 100;
    const animationDuration = Math.random() * 10 + 5; // 5s to 15s
    const animationDelay = Math.random() * 5;

    return (
      <div
        key={i}
        className="bubble"
        style={{
          width: size,
          height: size,
          left: `${left}%`,
          animationDuration: `${animationDuration}s`,
          animationDelay: `${animationDelay}s`,
        }}
      />
    );
  });

  return (
    <div className="bubble-background">
      {bubbles}
    </div>
  );
}
