export function computeCameraFitForNodes(nodes, currentCameraPosition, aspectRatio) {
  const points = nodes.filter((node) => node.x != null);
  if (!points.length) return null;
  const center = points.reduce((acc, node) => ({
    x: acc.x + node.x,
    y: acc.y + node.y,
    z: acc.z + node.z
  }), { x: 0, y: 0, z: 0 });
  center.x /= points.length;
  center.y /= points.length;
  center.z /= points.length;
  const radius = Math.max(18, ...points.map((node) => Math.hypot(node.x - center.x, node.y - center.y, node.z - center.z) + (node.size || 8)));
  const direction = {
    x: currentCameraPosition.x - center.x,
    y: currentCameraPosition.y - center.y,
    z: currentCameraPosition.z - center.z
  };
  const length = Math.hypot(direction.x, direction.y, direction.z) || 1;
  const distance = Math.max(46, radius * (aspectRatio > 1.35 ? 1.35 : 1.7));
  const target = {
    x: center.x + direction.x / length * distance,
    y: center.y + direction.y / length * distance,
    z: center.z + direction.z / length * distance
  };
  return { target, center };
}
