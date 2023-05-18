import * as THREE from 'three'
import {OrbitControls} from 'three/addons/controls/OrbitControls.js'
import ImageProcessing from './imageprocessing.js'
import ShaderLoader from './shaderloader.js'


export default class Anaglyph {

    #mode

    #material
    #plane

    #offscreanScene
    #offscreanCamera
    #renderTarget

    #controls

    #shaderLoader
    #shaders = []

    static modes = {
        right: 0,
        true: 1,
        gray: 2,
        color: 3,
        halfcolor: 4,
        optimized: 5
    }

    constructor(renderer) {
        this.#mode = Anaglyph.modes.right
        
        this.#shaderLoader = new ShaderLoader()
        this.#initShaders()
        this.#initMaterial()
        this.#initOffscrean()
        this.#initOrbitControls(renderer)
    }

    setTexture(texture) { // the texture should be already processed by ImageProcessing.process
        this.#material.uniforms.image.value = texture
    }

    setResolution(width, height) { // should be called in video.onLoadedVideo
        this.#renderTarget = new THREE.WebGLRenderTarget(width, height, {
            type: THREE.FloatType,
            magFilter: THREE.NearestFilter,
            minFilter: THREE.NearestFilter
        })
    }

    process(renderer) {
        if (this.#plane) {
            this.#offscreanScene.remove(this.#plane)
            this.#plane.geometry.dispose()
        }
        this.#plane = new THREE.Mesh(new THREE.PlaneGeometry(1,1), this.#material)
        this.#offscreanScene.add(this.#plane)

        if (this.#renderTarget) {
            // offscrean rendering
            renderer.setRenderTarget(this.#renderTarget)
            renderer.clear()
            renderer.render(this.#offscreanScene, this.#offscreanCamera)
            renderer.setRenderTarget(null)
        }
    }

    #initMaterial() {
        this.#material = new THREE.ShaderMaterial({
            uniforms: {
                image: {value: null}
            },
            vertexShader: this.#shaderLoader.load('./shaders/basic.vert.glsl'),
            fragmentShader: this.#shaders[this.#mode],
            glslVersion: THREE.GLSL3
        })
    }

    #initOffscrean() {
        this.#offscreanScene = new THREE.Scene()
        this.#offscreanCamera = new THREE.OrthographicCamera(-.5, .5, .5, -.5, 0., 1.)
    }

    #initOrbitControls(renderer) {
        this.#controls = new OrbitControls(this.#offscreanCamera, renderer.domElement)
        this.#controls.maxZoom = 10.
        this.#controls.minZoom = 1.
        this.#controls.enableRotate = false
        this.#controls.enablePan = true
        this.#controls.update()
    }

    #initShaders() {
        this.#shaders[Anaglyph.modes.right] = this.#shaderLoader.load('./shaders/right.frag.glsl')
        this.#shaders[Anaglyph.modes.true] = this.#shaderLoader.load('./shaders/anaglyphs/true.frag.glsl')
        this.#shaders[Anaglyph.modes.gray] = this.#shaderLoader.load('./shaders/anaglyphs/gray.frag.glsl')
        this.#shaders[Anaglyph.modes.color] = this.#shaderLoader.load('./shaders/anaglyphs/color.frag.glsl')
        this.#shaders[Anaglyph.modes.halfcolor] = this.#shaderLoader.load('./shaders/anaglyphs/halfcolor.frag.glsl')
        this.#shaders[Anaglyph.modes.optimized] = this.#shaderLoader.load('./shaders/anaglyphs/optimized.frag.glsl')
    }

    get texture() {
        return this.#renderTarget.texture
    }

    get mode() {
        return this.#mode
    }

    set mode(value) {
        this.#mode = value
        this.#material.fragmentShader = this.#shaders[this.#mode]
        this.#material.needsUpdate = true
    }

}