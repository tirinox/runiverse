uniform sampler2D baseTexture;
uniform float baseSpeed;
uniform float repeatS;
uniform float repeatT;

uniform sampler2D noiseTexture;
uniform float noiseScale;

uniform sampler2D blendTexture;
uniform float blendSpeed;
uniform float blendOffset;

uniform float time;
uniform float alpha;

uniform vec3 assetColor;
uniform vec3 assetColor2;
uniform vec3 sisterColor;
uniform float sistersDistance;

varying vec2 vUv;
varying float v_distanceToSister;
varying vec3 vNormal;
varying float sisterProximity;

void main()
{
    vec2 uvTimeShift = vUv + vec2(-0.7, 1.5) * time * baseSpeed;
    vec4 noiseGeneratorTimeShift = texture2D(noiseTexture, uvTimeShift);
    vec2 uvNoiseTimeShift = vUv + noiseScale * vec2(noiseGeneratorTimeShift.r, noiseGeneratorTimeShift.b);
    vec4 baseColor = texture2D(baseTexture, uvNoiseTimeShift * vec2(repeatS, repeatT));

    vec2 uvTimeShift2 = vUv + vec2(1.3, -1.7) * time * blendSpeed;
    vec4 noiseGeneratorTimeShift2 = texture2D(noiseTexture, uvTimeShift2);
    vec2 uvNoiseTimeShift2 = vUv + noiseScale * vec2(noiseGeneratorTimeShift2.g, noiseGeneratorTimeShift2.b);
    vec4 blendColor = texture2D(blendTexture, uvNoiseTimeShift2 * vec2(repeatS, repeatT)) - blendOffset * vec4(1.0, 1.0, 1.0, 1.0);

    vec4 theColor = baseColor + blendColor;
    vec3 colorizer = mix(assetColor, assetColor2, vUv.y);
    colorizer = vNormal.y > 0.0 ? mix(sisterColor, colorizer, 0.5 + v_distanceToSister) : vec3(0.0);

    theColor *= vec4(colorizer, 0.0);

    // edge lighting
//    float f = log(v_distanceToSister) * 0.3;
//    float f = pow(1.0 - abs(vNormal.z), 1.0);
    // float sisterBrightness = vNormal.x > 0.0 ? 1.0 : mix(0.8, 2.5, f);
//    float sisterBrightness = mix(0.8, 2.5, f);

//    theColor *= sisterBrightness;

    theColor.a = alpha;
    gl_FragColor = theColor;
}