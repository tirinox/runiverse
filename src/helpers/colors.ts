import {hashedParameterFloat01} from "@/helpers/data_utils";
import {Color} from "three";

export const RUNE_COLOR = 0x28f4af
export const RUNE_COLOR_GRAD_1 = 0x31fd9c
export const RUNE_COLOR_GRAD_2 = 0x01cefd

export function hashedColorTint(input: string, path: string, saturation: number = 1.0, luminance: number = 0.5) {
    const color = new Color(0, 0, 0)
    color.setHSL(hashedParameterFloat01(input, path), saturation, luminance)
    return color
}
