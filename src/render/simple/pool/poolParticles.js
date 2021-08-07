import particleJson from "@/render/simple/particles/example2";
import Nebula, {SpriteRenderer} from "three-nebula";
import * as THREE from "three";

export async function addPoolParticleSystemTo(obj) {
    const systemDesc = await Nebula.fromJSONAsync(particleJson, THREE)
    const nebulaRenderer = new SpriteRenderer(obj, THREE);
    const nebula = systemDesc.addRenderer(nebulaRenderer);
    return nebula
}
