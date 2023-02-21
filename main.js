import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { GUI } from 'three/addons/libs/lil-gui.module.min.js'
import Stats from 'three/addons/libs/stats.module.js'
import Histogram from './histogram.js'
import Particle from './particle.js'


let camera, orbitCamera, scene, orbitScene, renderer
let video, videoTexture
let histogram, particle
let stats
let constraints, availableDevices = {}

init()
animate()


async function init() {
    const container = document.createElement('div')
    document.body.appendChild(container)

    renderer = new THREE.WebGLRenderer({antialias: true, alpha: true})
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setClearColor(0x000000)
    renderer.shadowMap.enabled = false
    renderer.autoClear = false
    container.appendChild(renderer.domElement)

    scene = new THREE.Scene()
    orbitScene = new THREE.Scene()

    const aspect = window.innerWidth / window.innerHeight
    // camera = new THREE.PerspectiveCamera(75, aspect, .01, 10)
    camera = new THREE.OrthographicCamera(-aspect/2, aspect/2, 1/2, -1/2, .01, 10)
    orbitCamera = new THREE.PerspectiveCamera(75, aspect, .001, 10)
    camera.position.z = .5
    orbitCamera.position.z = .5
    orbitCamera.position.y = .1

    const controls = new OrbitControls(orbitCamera, renderer.domElement)
    controls.maxDistance = 1
    controls.minDistance = .1
    controls.enablePan = false
    controls.update()

    stats = new Stats()
    container.appendChild(stats.dom)

    window.addEventListener('resize', onWindowResize, false)


    histogram = new Histogram()
    const histogramMesh = histogram.mesh
    histogramMesh.position.y = -.3
    scene.add(histogramMesh)

    particle = new Particle() // added to scene later
    
    const gui = new GUI({title: 'Settings'})
    gui.close()
    guiHistogram(gui)
    guiParticle(gui)


    if (!navigator.mediaDevices?.getUserMedia) throw new Error('navigator.mediaDevices is not loaded.')
    const _devices = await navigator.mediaDevices.enumerateDevices()
    const _videoDevices = _devices.filter((device) => device.kind == 'videoinput')
    _videoDevices.map((videoDevice) => availableDevices[videoDevice.label] = videoDevice.deviceId)
    
    constraints = {video: {width: 1920, height: 1080, deviceID: Object.values(availableDevices)[0]}}
    if (isMobile()) constraints.video['facingMode'] = {exact: 'environment'}
    console.log(constraints)
    const userMedia = await navigator.mediaDevices.getUserMedia(constraints)
    video = document.createElement('video')
    video.autoplay = true
    video.muted = true
    video.playsInline = true
    video.srcObject = userMedia
    video.onloadeddata = videoOnLoadedData()
    video.play()

    guiVideoCamera(gui)
}

function render() {
    histogram.compute(renderer)

    renderer.clear()
    renderer.render(scene, camera)
    renderer.render(orbitScene, orbitCamera)
}

function animate() {
    requestAnimationFrame(animate)

    if (histogram.needsUpdate) histogram.loadCoordGeometry(video)
    if (particle.needsUpdate) {
        orbitScene.remove(orbitScene.getObjectByName('particle'))
        particle.loadGeometry(video)
        const particleMesh = particle.mesh
        particleMesh.name = 'particle'
        particleMesh.position.y = .1
        orbitScene.add(particleMesh)
    }
    stats.update()

    render()
}

function guiHistogram(gui) {
    const folder = gui.addFolder('Histogram')
    folder.add(histogram, 'downsamplingRate', 1., 32.).step(1.).name('down-sampling rate')
    folder.add(histogram, 'roughness', 1., 32.).step(1.).name('roughness')
    folder.close()
}

function guiParticle(gui) {
    const folder = gui.addFolder('Particle')
    folder.add(particle, 'downsamplingRate', 1., 16.).step(1.).name('down-sampling rate')
    folder.add(particle, 'mode', Particle.space).name('mode')
    folder.close()
}

function guiVideoCamera(gui) {
    const folder = gui.addFolder('Camera')
    folder.add(constraints.video, 'deviceID', availableDevices).name('use').onChange(async(value) => {
        const userMedia = await navigator.mediaDevices.getUserMedia(constraints)
        video.srcObject = userMedia
        video.onloadeddata = videoOnLoadedData()
        video.play()
    })
    folder.close()
}

function videoOnLoadedData() {
    return function() {
        videoTexture = new THREE.VideoTexture(video)
        videoTexture.minFilter = THREE.NearestFilter
        videoTexture.magFilter = THREE.NearestFilter
        videoTexture.generateMipmaps = false
        videoTexture.format = THREE.RGBAFormat

        scene.background = videoTexture
        
        histogram.loadCoordGeometry(video)
        histogram.setVideoTexture(videoTexture)

        orbitScene.remove(orbitScene.getObjectByName('particle'))
        particle.loadGeometry(video)
        particle.setVideoTexture(videoTexture)
        const particleMesh = particle.mesh
        particleMesh.name = 'particle'
        particleMesh.position.y = .1
        orbitScene.add(particleMesh)
    }
}

function onWindowResize() {
    const width = window.innerWidth
    const height = window.innerHeight
    const aspect = width / height
    
    // camera.aspect = aspect
    camera.left = -aspect/2
    camera.right = aspect/2
    camera.top = 1/2
    camera.bottom = -1/2
    camera.updateProjectionMatrix()

    orbitCamera.aspect = aspect
    orbitCamera.updateProjectionMatrix()

    renderer.setSize(width, height)
    render()
}

function isMobile() {
    if (navigator.userAgent.match(/iPhone|iPad|Android.+Mobile/)) return true
    return false
}