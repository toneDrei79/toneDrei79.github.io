import * as THREE from 'three'
import ShaderLoader from './shaderloader.js'


export default class ImageProcessing {

    #mode
    #kernelsize
    #sigma
    
    #material
    #plane

    #offscreanScene
    #offscreanCamera
    #renderTarget

    #shaderLoader
    #shaders = []

    static modes = {
        gaussian: 0,
        laplacian: 1,
        separatedgaussian: 2,
        median: 3,
        log: 4
    }

    constructor() {
        this.#mode = ImageProcessing.modes.gaussian
        this.#kernelsize = 1
        this.#sigma = 1.

        this.#shaderLoader = new ShaderLoader()
        this.#initShaders()
        this.#initMaterial()
        this.#initOffscrean()
    }

    setTexture(texture) { // should be called in video.onLoadedVideo
        this.#material.uniforms.image.value = texture
        this.#_material.uniforms.image.value = texture // for separated gaussian filtering
    }

    setResolution(width, height) { // should be called in video.onLoadedVideo
        this.#renderTarget = new THREE.WebGLRenderTarget(width, height, {
            type: THREE.FloatType,
            magFilter: THREE.NearestFilter,
            minFilter: THREE.NearestFilter
        })
        this.#material.uniforms.resolution.value = new THREE.Vector2(width, height)

        // for separated gaussian filtering
        this.#_renderTarget = new THREE.WebGLRenderTarget()
        this.#_renderTarget.copy(this.#renderTarget)
        this.#_material.uniforms.resolution.value = new THREE.Vector2(width, height)
    }

    process(renderer) {
        if (this.#mode == ImageProcessing.modes.separatedgaussian) { // need to do offscrean rendering additionally
            const processedImage = this.#_process(renderer)
            this.#material.uniforms.image.value = processedImage
        }
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

    #_offscreanScene
    #_offscreanCamera
    #_renderTarget
    #_material
    #_plane
    #_process(renderer) { // extra offscrean rendering for separated gaussian filtering
        if (this.#_plane) {
            this.#_offscreanScene.remove(this.#_plane)
            this.#_plane.geometry.dispose()
        }
        this.#_plane = new THREE.Mesh(new THREE.PlaneGeometry(1,1), this.#_material)
        this.#_offscreanScene.add(this.#_plane)

        // offscrean rendering
        renderer.setRenderTarget(this.#_renderTarget)
        renderer.clear()
        renderer.render(this.#_offscreanScene, this.#_offscreanCamera)
        renderer.setRenderTarget(null)

        const image = this.#_renderTarget.texture

        return image
    }

    #initMaterial() {
        this.#material = new THREE.ShaderMaterial({
            uniforms: {
                image: {value: null}, // will be set after loading video via setTexture()
                resolution: {value: null}, // will be set after loading video via setResolution()
                kernelsize: {value: this.#kernelsize},
                sigma: {value: this.#sigma},

            },
            vertexShader: this.#shaderLoader.load('./shaders/basic.vert.glsl'),
            fragmentShader: this.#shaders[this.#mode],
            glslVersion: THREE.GLSL3
        })

        this.#_material = new THREE.ShaderMaterial()
        this.#_material.copy(this.#material)
        this.#_material.fragmentShader = this.#shaders[5]
        this.#_material.needsUpdate = true
    }

    #initOffscrean() {
        this.#offscreanScene = new THREE.Scene()
        this.#offscreanCamera = new THREE.OrthographicCamera(-.5, .5, .5, -.5, 0., 1.)

        this.#_offscreanScene = new THREE.Scene()
        this.#_offscreanCamera = new THREE.OrthographicCamera(-.5, .5, .5, -.5, 0., 1.)
    }

    #initShaders() {
        this.#shaders[ImageProcessing.modes.gaussian] = this.#shaderLoader.load('./shaders/filterings/gaussian.frag.glsl')
        this.#shaders[ImageProcessing.modes.laplacian] = this.#shaderLoader.load('./shaders/filterings/laplacian.frag.glsl')
        this.#shaders[ImageProcessing.modes.separatedgaussian] = this.#shaderLoader.load('./shaders/filterings/separatedgaussian_v.frag.glsl')
        this.#shaders[ImageProcessing.modes.median] = this.#shaderLoader.load('./shaders/filterings/median.frag.glsl')
        this.#shaders[ImageProcessing.modes.log] = this.#shaderLoader.load('./shaders/filterings/log.frag.glsl')
        this.#shaders[5] = this.#shaderLoader.load('./shaders/filterings/separatedgaussian_h.frag.glsl')
    }

    get texture() {
        return this.#renderTarget.texture
    }

    get mode() {
        return this.#mode
    }

    get kernelsize() {
        return this.#kernelsize
    }

    get sigma() {
        return this.#sigma
    }

    set mode(value) {
        this.#mode = value
        this.#material.fragmentShader = this.#shaders[this.#mode]
        this.#material.needsUpdate = true
    }

    set kernelsize(value) {
        this.#kernelsize = value
        this.#material.uniforms.kernelsize.value = this.#kernelsize
        this.#_material.uniforms.kernelsize.value = this.#kernelsize
    }

    set sigma(value) {
        this.#sigma = value
        this.#material.uniforms.sigma.value = this.#sigma
        this.#_material.uniforms.sigma.value = this.#sigma
    }

}