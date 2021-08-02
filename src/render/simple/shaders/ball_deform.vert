uniform sampler2D noiseTexture;
uniform float noiseScale;

uniform sampler2D bumpTexture;
uniform float bumpSpeed;
uniform float bumpScale;
uniform float time;

varying vec2 vUv;
varying vec3 vNormal;

void main()
{
    vec4 norm4 = vec4(normal.x, normal.y, normal.z, 1.0);
    vNormal = normalize((modelViewMatrix * norm4).xyz);
//    vNormal = normal;
    vUv = uv;

    vec2 uvTimeShift = vUv + vec2(1.1, 1.9) * time * bumpSpeed;
    vec4 noiseGeneratorTimeShift = texture2D(noiseTexture, uvTimeShift);
    vec2 uvNoiseTimeShift = vUv + noiseScale * vec2(noiseGeneratorTimeShift.r, noiseGeneratorTimeShift.g);
    // below, using uvTimeShift seems to result in more of a "rippling" effect
    //   while uvNoiseTimeShift seems to result in more of a "shivering" effect
    vec4 bumpData = texture2D(bumpTexture, uvTimeShift);

    // move the position along the normal
    //  but displace the vertices at the poles by the same amount
    float displacement = (vUv.y > 0.999 || vUv.y < 0.001) ?
    bumpScale * (0.3 + 0.02 * sin(time)) :
    bumpScale * bumpData.r;
    vec3 newPosition = position + normal * displacement;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
}