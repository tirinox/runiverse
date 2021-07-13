varying vec3 rayOrigin;
varying vec3 hitPosition;


void main() {
    vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
    hitPosition = position;

    vec4 cameraPoint = vec4(cameraPosition, 1.0);
    rayOrigin = (inverse(modelMatrix) * cameraPoint).xyz;

    gl_Position = projectionMatrix * modelViewPosition;
}
