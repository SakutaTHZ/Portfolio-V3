import { useEffect, useRef } from "react";
import AppIcon from "./AppIcon";
import Shredder from "./Shredder";

const SLIT = 4;
const FALL = 168;

export default function IconShred({ name, width, height, onDone }) {
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(() => doneRef.current?.(), reduce ? 420 : 2800);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <Shredder
      items={[{ id: "icon", name }]}
      renderItem={(item) => <AppIcon name={item.name} size={width} />}
      width={width}
      height={Math.max(height, width) + SLIT + FALL}
      inset={0}
      gap={0}
      slitHeight={SLIT}
      fallHeight={FALL}
      feedSpeed={260}
      bite={6}
      stripWidth={6}
      curl={1.2}
      slitColor="rgba(17, 17, 17, 0.8)"
      color="transparent"
      shredOnMount
      className="pg-shredder"
    />
  );
}
