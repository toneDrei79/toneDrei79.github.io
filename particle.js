import * as THREE from 'three'
import ShaderLoader from './shaderloader.js'

export default class Particle {

    #material
    #geometry

    #needsUpdate

    #shaderLoader

    constructor() {
        this.#needsUpdate = false
        this.#shaderLoader = new ShaderLoader()

        this.#initMaterial()
    }

    #initMaterial() {
        this.#material = new THREE.ShaderMaterial({
            uniforms: {
                tex: {value: null}, // video texture will be set after loaded
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
        const width = video.videoWidth / 4. // downsampling
        const height = video.videoHeight / 4. // downsampling
        
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

        this.#needsUpdate = false
    }

    get mesh() { // should be taken after load geometry (in video.onLoadedVideo)
        if (!this.#geometry) throw new Error('Particle geometry is not loaded.')

        const group = new THREE.Group()        

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
        
        for (let i=0, pos=[[0.,-.5,-.5],[-.5,0.,-.5],[-.5,-.5,0.]], rot=[[0.,0.,Math.PI/2],[0.,0.,0.],[Math.PI/2,0.,0.]]; i<3; i++) {
            const color = [0., 0., 0.]
            color[i] = 1.
            const axis = new THREE.Mesh(
                new THREE.CylinderGeometry(.005, .005, 1),
                new THREE.MeshBasicMaterial({
                    color: new THREE.Color(color[0], color[1], color[2]),
                    transparent: true,
                    opacity: .3
                })
            )
            axis.position.set(pos[i][0], pos[i][1], pos[i][2])
            axis.rotation.set(rot[i][0], rot[i][1], rot[i][2])
            group.add(axis)
        }
        
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

}