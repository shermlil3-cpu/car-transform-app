// Reusable prompt template for the "mechanical garage transformation" effect.
// Fill in the two vehicle descriptions; the garage + camera framing stays fixed.

export const SEEDANCE_MODEL_ID = "seedance-2.0-image-to-video";

export function buildTransformationPrompt(startVehicle: string, endVehicle: string): string {
  return `Static camera locked on a rustic vintage garage full of old oil cans, gas pumps, neon Chevrolet sign, and vintage advertising signs — the garage, lighting, and all background props remain completely unchanged throughout. In the center, ${startVehicle} undergoes a rigid, mechanical, Transformers-style transformation into ${endVehicle}. The transformation is mechanical, not fluid: the vehicle's body panels visibly detach along seams, hinge open, rotate, and telescope as the starting body contracts and reconfigures panel by panel into the ending shape. Brief glimpses of exposed mechanical framework, pistons, and rotating gears are visible between the shifting panels. The starting paint peels away in mechanical plates revealing the fresh ending paint underneath, chrome trim clicks into place with mechanical snaps, the suspension mechanically adjusts the ride height, and the starting wheels rotate and swap into the ending wheels. Sharp metallic clank and servo whirring sound effects punctuate each mechanical movement. Photorealistic detail, warm garage lighting, steady locked-off three-quarter angle shot throughout with the garage background never moving.`;
}

export const DEFAULT_START_VEHICLE =
  "a weathered gray-primer classic pickup truck with chrome bumper and steel wheels";
export const DEFAULT_END_VEHICLE =
  "a fully restored glossy classic muscle car with chrome billet wheels and a lowered stance";
