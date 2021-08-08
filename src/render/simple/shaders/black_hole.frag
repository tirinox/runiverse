varying vec3 rayOrigin;
varying vec3 hitPosition;

uniform samplerCube texEnvironMap;
uniform sampler2D texNoise;

uniform float time;

const float pi2 = 2.0 * 3.1415927;

float sdSphere(vec3 p, float s) {
    return length(p) - s;
}


float sdTorus(vec3 p, vec2 t) {
    vec2 q = vec2(length(p.xz) - t.x, p.y);
    return length(q) - t.y;
}

vec4 blackHole(vec3 ro, vec3 rd) {
    const vec3 blackHolePosition = vec3(0.0, 0.0, 0.0);
    const float blackHoleRadius = 0.1;
//    const float blackHoleMass = 5.0 * 0.001;// premul G = 0.001
    const float blackHoleMass = 1.0 * 0.001; // premul G = 0.001
    const vec3 c1 = vec3(0.5, 0.46, 0.4);
    const vec3 c2 = vec3(1.0, 0.8, 0.6);
    const vec3 glowC = vec3(1.0, 0.9, 0.85);
//    const float glowFac = 0.0015; // orig: 0.0033
    const float glowFac = 0.00001; // orig: 0.0033

    const int maxSteps = 350; // 320 default
    const float dt = 0.08; // ray step. default: 0.02

    const float animationSeed = 1.0;

    vec3 currentRayPos = ro;// currentPosition
    vec3 currentRayDir = rd;// currentRay direction

    vec3 accColor = vec3(0.0);

    float nonCaptured = 1.0;

    // pre-step
    float dToBlackHole = length(currentRayPos - blackHolePosition);
    currentRayPos += currentRayDir * (dToBlackHole - 5.0);// pre step to BH

    for (int i = 0; i < maxSteps; i++) {
        // gravity
        vec3 bhv = blackHolePosition - currentRayPos;

        float r2 = dot(bhv, bhv);
        float r = sqrt(r2);

        currentRayDir += normalize(bhv) * (blackHoleMass / r2);

        nonCaptured = smoothstep(0.0, 0.666, r - blackHoleRadius); // sdSphere opt.

        // Texture for the accretion disc
        float dr = length(bhv.xz);
        float da = atan(bhv.x, bhv.z);

        vec2 ra = vec2(dr, da * (0.01 + (dr - blackHoleRadius) * 0.02) + pi2 + time * animationSeed);
        ra *= vec2(5.0, 10.0);

        float textureRead = texture(texNoise, ra * vec2(0.1, 0.5)).r + 0.5;

        vec3 dcol = mix(c2, c1, pow(length(bhv) - blackHoleRadius, 2.0)) * max(0.0, textureRead) * (4.0 / ((0.001 + (length(bhv) - blackHoleRadius) * 50.0)));

        accColor += max(vec3(0.0), dcol * smoothstep(0.0, 1.0, -sdTorus((currentRayPos * vec3(1.0, 25.0, 1.0)) - blackHolePosition, vec2(0.8, 0.99))) * nonCaptured);
         accColor += dcol * (1.0 / dr) * nonCaptured * 0.01; // pole streams!

        // Glow
        accColor += glowC * vec3(1.0 / r2) * glowFac * nonCaptured;

        // step
        currentRayPos += currentRayDir * dt * nonCaptured ; // todo: step according distance to black hole, so maxSteps may be lower!!
    }

    // BG
//        vec3 envUV = vec3(currentRayDir.x, currentRayDir.y, currentRayDir.z);
    vec3 envUV = currentRayDir;
    accColor += texture(texEnvironMap, envUV).rgb * nonCaptured;

    const float a = 1.0;
    // Final color
    return vec4(accColor, a);
}

void main() {
    vec3 rayDirection = normalize(hitPosition - rayOrigin);
    vec4 bhColor = blackHole(rayOrigin, rayDirection);
    gl_FragColor = bhColor;
}