uniform sampler2D noiseTexture;
uniform float noiseScale;

uniform sampler2D bumpTexture;
uniform float bumpSpeed;
uniform float bumpScale;
uniform float time;

varying vec2 vUv;

uniform vec3 sisterWorldPos;
uniform vec3 thisWorldPos;

varying float sisterProximity;

varying vec3 vNormal;
uniform float sistersDistance;

void main()
{
    vUv = uv;

    vec2 uvTimeShift = vUv + vec2(1.1, 1.9) * time * bumpSpeed;
    vec4 noiseGeneratorTimeShift = texture2D(noiseTexture, uvTimeShift);
    vec2 uvNoiseTimeShift = vUv + noiseScale * vec2(noiseGeneratorTimeShift.r, noiseGeneratorTimeShift.g);
    // below, using uvTimeShift seems to result in more of a "rippling" effect
    //   while uvNoiseTimeShift seems to result in more of a "shivering" effect
    vec4 bumpData = texture2D(bumpTexture, uvTimeShift);

    // ----- sister proximity:
    vec3 surfaceWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
//    sisterProximity = length(surfaceWorldPosition - sisterWorldPos) / sistersDistance;
    sisterProximity = dot(normalize(postion.xyz), normalize(thisWorldPos - sisterWorldPos));

    // move the position along the normal
    //  but displace the vertices at the poles by the same amount
    float displacement = (vUv.y > 0.999 || vUv.y < 0.001) ? (0.3 + 0.05 * sin(time)) : bumpData.r;
    vec3 newPosition = position + normal * displacement * bumpScale / v_distanceToSister;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);

    vNormal = normalMatrix * normal;
}