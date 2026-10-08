/** Handle file drops before the browser navigates to the dropped local file. */
export function installFileDrop(
  target: EventTarget,
  onFile: (file: File) => void,
  onDragging: (dragging: boolean) => void,
) {
  let depth = 0;
  const isFile = (event: DragEvent) => Array.from(event.dataTransfer?.types ?? []).includes("Files");
  const enter = (raw: Event) => {
    const event = raw as DragEvent;
    if (!isFile(event)) return;
    event.preventDefault();
    depth++;
    onDragging(true);
  };
  const over = (raw: Event) => {
    const event = raw as DragEvent;
    if (!isFile(event)) return;
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = "copy";
  };
  const leave = (raw: Event) => {
    if (!isFile(raw as DragEvent)) return;
    depth = Math.max(0, depth - 1);
    if (!depth) onDragging(false);
  };
  const drop = (raw: Event) => {
    const event = raw as DragEvent;
    if (!isFile(event)) return;
    event.preventDefault();
    event.stopPropagation();
    depth = 0;
    onDragging(false);
    const file = event.dataTransfer?.files[0];
    if (file) onFile(file);
  };
  const reset = () => { depth = 0; onDragging(false); };
  const listeners = { dragenter: enter, dragover: over, dragleave: leave, drop, dragend: reset, blur: reset };
  const options = { capture: true };
  for (const [name, handler] of Object.entries(listeners)) target.addEventListener(name, handler, options);
  return () => {
    for (const [name, handler] of Object.entries(listeners)) target.removeEventListener(name, handler, options);
  };
}
