import * as THREE from 'three'
import ShaderLoader from './shaderloader.js'

export default class Particle {

    #material
    #geometry

    #downsamplingRate
    #mode
    #needsUpdate

    #shaderLoader

    static space = {
        sRGB: 0,
        CIEXYZ: 1,
        CIExyY: 2,
        CIELab: 3
    }

    constructor() {
        this.#downsamplingRate = 4.
        this.#mode = Particle.space.sRGB
        this.#needsUpdate = false
        this.#shaderLoader = new ShaderLoader()

        this.#initMaterial()
    }

    #initMaterial() {
        this.#material = new THREE.ShaderMaterial({
            uniforms: {
                tex: {value: null}, // video texture will be set after loaded
                mode: {value: this.#mode},
                isShadow: {value: false}
            },
            vertexShader: this.#shaderLoader.load('./shaders/particle.vert.glsl'),
            fragmentShader: this.#shaderLoader.load('./shaders/particle.frag.glsl'),

            depthTest: false,
            transparent: true
        })
    }

    setVideoTexture(texture) { // should be called in video.onLoadedVideo
        this.#material.uniforms.tex.value = texture
    }

    loadGeometry(video) { // should be called in video.onLoadedVideo or needs update
        const width = video.videoWidth / this.#downsamplingRate
        const height = video.videoHeight / this.#downsamplingRate
        
        const positions = []
        for (let j=0; j<height; j++) {
            for (let i=0; i< width; i++) {
                positions.push((i+0.5)/width, (j+0.5)/height, 0.)
            }
        }
        
        const geometry = new THREE.BufferGeometry()
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
        geometry.computeBoundingSphere()
        this.#geometry = geometry

        this.#material.uniforms.mode.value = this.#mode

        this.#needsUpdate = false
    }

    #generateSpace(group) {
        const background = new THREE.Mesh(
            new THREE.BoxGeometry(1,1,1),
            new THREE.MeshBasicMaterial({
                color: 0xffffff,
                side: THREE.BackSide,
                transparent: true,
                opacity: 0.1
            })
        )
        group.add(background)
        const grid = new THREE.GridHelper(1, 10, 0x777777, 0x777777)
        grid.position.y = -.5
        group.add(grid)

        let pos = [[0.,-.5,-.5],[-.5,0.,-.5],[-.5,-.5,0.]]
        let rot = [[0.,0.,Math.PI/2.],[0.,0.,0.],[Math.PI/2.,0.,0.]]
        let color = [[0.,1.,0.],[0.,0.,1.],[1.,0.,0.]]
        if (this.#mode == Particle.space.CIExyY) {
            color = [[1.,.3,0.],[1.,1.,1.],[0.,.5,1.]]
        }
        else if (this.#mode == Particle.space.CIELab) {
            pos = [[0.,-.5,0.],[0.,0.,0.],[0.,-.5,0.]]
            color = [[.5,0.,1.],[1.,1.,1.],[.7,1.,0.]]
        }
        for (let i=0; i<3; i++) {
            const axis = new THREE.Mesh(
                new THREE.CylinderGeometry(.005, .005, 1),
                new THREE.MeshBasicMaterial({
                    color: new THREE.Color(color[i][0], color[i][1], color[i][2]),
                    transparent: true,
                    opacity: .3
                })
            )
            axis.position.set(pos[i][0], pos[i][1], pos[i][2])
            axis.rotation.set(rot[i][0], rot[i][1], rot[i][2])
            group.add(axis)
        }
    }

    get mesh() { // should be taken after load geometry (in video.onLoadedVideo)
        if (!this.#geometry) throw new Error('Particle geometry is not loaded.')

        const group = new THREE.Group()
        this.#generateSpace(group)
        
        const particle = new THREE.Points(this.#geometry, this.#material)

        const shadowMaterial = this.#material.clone()
        shadowMaterial.uniforms.isShadow.value = true
        const shadow = new THREE.Points(this.#geometry, shadowMaterial)
        
        group.add(particle)
        group.add(shadow)
        group.scale.set(.2, .2, .2)

        return group
    }

    get needsUpdate() {
        return this.#needsUpdate
    }

    get downsamplingRate() {
        return this.#downsamplingRate
    }

    set downsamplingRate(value) {
        this.#downsamplingRate = value
        this.#needsUpdate = true
    }

    get mode() {
        return this.#mode
    }

    set mode(value) {
        this.#mode = value
        this.#needsUpdate = true
    }

}