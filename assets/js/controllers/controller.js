export function createController(definition) {
  const controller = {
    id: definition.id,
    mount: definition.mount || (() => {}),
    unmount: definition.unmount || (() => {}),
    render: definition.render || (() => {})
  };
  return controller;
}

export function mountControllers(controllers, context) {
  const cleanups = [];
  for (const controller of controllers) {
    const cleanup = controller.mount?.(context);
    if (typeof cleanup === "function") cleanups.push(cleanup);
  }
  return () => {
    for (const cleanup of cleanups.reverse()) cleanup();
    for (const controller of controllers.slice().reverse()) controller.unmount?.(context);
  };
}
