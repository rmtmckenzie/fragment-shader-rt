function debug(s)
{
    console.debug(s);
    $("debug").append("<code>" + s + "</code>" + "<br>")
}






function drag_to_rotation(dx, dy)
{
    /* XXX grantham 990825 - this "dist" doesn't make me confident. */
    /* but I put in the *10000 to decrease chance of underflow  (???) */
    var dist = Math.sqrt(dx * 10000 * dx * 10000 + dy * 10000 * dy * 10000) / 10000
    /* dist = sqrt(dx * dx + dy * dy) */

    var rotation = [Math.PI * dist, dy / dist, dx / dist, 0.0]
    return rotation
}

function trackball_motion(prevrotation, dx, dy)
{
    var rotation = drag_to_rotation(dx, dy)
    var newrotation = rotation_mult_rotation(prevrotation, rotation)
    return newrotation
}

zoom = 1.0

light_dir = vec3(0, 0, -1)
light_rotation = [0, 0, 0, 1]

object_rotation = [0, 0, 0, 1]
object_position = vec3(0, 0, 0)

function create_camera_matrix(viewpoint, yaw, pitch, roll, scene_data)
{
    var matrix = mat4_make_identity()

    /* rotate around Z to roll */
    var roll_matrix = mat4_make_rotation(roll, 0, 0, 1)
    matrix = mat4_mult(roll_matrix, matrix)

    /* rotate around X to pitch */
    var pitch_matrix = mat4_make_rotation(pitch, 1, 0, 0)
    matrix = mat4_mult(pitch_matrix, matrix)

    /* rotate around Y to yaw */
    var yaw_matrix = mat4_make_rotation(yaw, 0, 1, 0)
    matrix = mat4_mult(yaw_matrix, matrix)

    var viewpoint_matrix = mat4_make_translation(-viewpoint.X, -viewpoint.Y, -viewpoint.Z)
    var camera_matrix = mat4_mult(viewpoint_matrix, matrix)
    var camera_inverse = mat4_invert(camera_matrix)
    var camera_normal_matrix = mat4_transpose(camera_inverse)
    camera_normal_matrix[3] = 0.0
    camera_normal_matrix[7] = 0.0
    camera_normal_matrix[11] = 0.0

    scene_data.camera_matrix = new Float32Array(camera_matrix)
    scene_data.camera_normal_matrix = new Float32Array(camera_normal_matrix)
}

function create_object_matrix(center, rotation, position, scene_data)
{
    var matrix = mat4_make_rotation(rotation[0], rotation[1], rotation[2], rotation[3])
    var m2 = mat4_make_translation(center[0] + position.X, center[1] + position.Y, center[2] + position.Z)
    var object_matrix = mat4_mult(matrix, m2)

    var object_inverse = mat4_invert(object_matrix)

    var object_transpose = mat4_transpose(matrix)
    var object_normal_matrix = mat4_invert(object_transpose)
    object_normal_matrix[3] = 0.0
    object_normal_matrix[7] = 0.0
    object_normal_matrix[11] = 0.0

    var object_normal_inverse = mat4_transpose(object_matrix)
    object_normal_inverse[3] = 0.0
    object_normal_inverse[7] = 0.0
    object_normal_inverse[11] = 0.0

    scene_data.object_matrix = new Float32Array(object_matrix)
    scene_data.object_inverse = new Float32Array(object_inverse)
    scene_data.object_normal_matrix = new Float32Array(object_normal_matrix)
    scene_data.object_normal_inverse = new Float32Array(object_normal_inverse)
}

function update_light()
{
    var l1 = vec4(0, 0, -1, 0)
    var light_matrix = mat4_make_rotation(light_rotation[0], light_rotation[1], light_rotation[2], light_rotation[3])
    var l2 = mat4_mult_vec4(light_matrix, l1)

    light_dir.X = l2.X
    light_dir.Y = l2.Y
    light_dir.Z = l2.Z
}

function update_view_params(scene_data, zoom)
{
    var offset = vec3(0, 0, zoom * scene_data.scene_extent / 2 / Math.sin(scene_data.fov / 2))

    scene_data.eye = vec3_subtract(scene_data.scene_center, offset)

    create_camera_matrix(offset, 0, 0, 0, scene_data)

    create_object_matrix(scene_data.scene_center, object_rotation, object_position, scene_data)
}

// gRayTracingFragmentShaderText = getScriptText("gRayTracingFragmentShaderText")

// gDecalVertexShaderText = getScriptText("gDecalVertexShaderText")

function init_decal_geometry(gl, raytracer)
{
    verts = []
    verts[0 * 4 + 0] = -1.0
    verts[0 * 4 + 1] = -1.0
    verts[0 * 4 + 2] = 0.0
    verts[0 * 4 + 3] = 1.0
    verts[1 * 4 + 0] = 1.0
    verts[1 * 4 + 1] = -1.0
    verts[1 * 4 + 2] = 0.0
    verts[1 * 4 + 3] = 1.0
    verts[2 * 4 + 0] = -1.0
    verts[2 * 4 + 1] = 1.0
    verts[2 * 4 + 2] = 0.0
    verts[2 * 4 + 3] = 1.0
    verts[3 * 4 + 0] = 1.0
    verts[3 * 4 + 1] = 1.0
    verts[3 * 4 + 2] = 0.0
    verts[3 * 4 + 3] = 1.0
    raytracer.verts = new Float32Array(verts)

    texcoords = []
    texcoords[0 * 2 + 0] = 0.0
    texcoords[0 * 2 + 1] = 1.0
    texcoords[1 * 2 + 0] = 1.0
    texcoords[1 * 2 + 1] = 1.0
    texcoords[2 * 2 + 0] = 0.0
    texcoords[2 * 2 + 1] = 0.0
    texcoords[3 * 2 + 0] = 1.0
    texcoords[3 * 2 + 1] = 0.0
    raytracer.texcoords = new Float32Array(texcoords)

    raytracer.vert_buffer = gl.createBuffer()
    raytracer.texcoord_buffer = gl.createBuffer()

    gl.bindBuffer(gl.ARRAY_BUFFER, raytracer.vert_buffer)
    gl.bufferData(gl.ARRAY_BUFFER, raytracer.verts, gl.STATIC_DRAW)
    gl.vertexAttribPointer(raytracer.pos_attrib, 4, gl.FLOAT, gl.FALSE, 0, 0)
    gl.enableVertexAttribArray(raytracer.pos_attrib)

    gl.bindBuffer(gl.ARRAY_BUFFER, raytracer.texcoord_buffer)
    gl.bufferData(gl.ARRAY_BUFFER, raytracer.texcoords, gl.STATIC_DRAW)
    gl.vertexAttribPointer(raytracer.texcoord_attrib, 2, gl.FLOAT, gl.FALSE, 0, 0)
    gl.enableVertexAttribArray(raytracer.texcoord_attrib)
}


// Shader loading function boilerplate borrowed from https://sites.google.com/site/progyumming/javascript/shortest-webgl

function load_shaders(gl, raytracer)
{
    raytracer.vertex_shader = gl.createShader(gl.VERTEX_SHADER)
    gl.shaderSource(raytracer.vertex_shader, gDecalVertexShaderText)
    gl.compileShader(raytracer.vertex_shader)
    if (!gl.getShaderParameter(raytracer.vertex_shader, gl.COMPILE_STATUS)) {
        debug("Could not compile vertex shader:\n\n" + gl.getShaderInfoLog(raytracer.vertex_shader))
        return false
    }

    raytracer.fragment_shader = gl.createShader(gl.FRAGMENT_SHADER)
    gl.shaderSource(raytracer.fragment_shader, gRayTracingFragmentShaderText)
    gl.compileShader(raytracer.fragment_shader)
    if (!gl.getShaderParameter(raytracer.fragment_shader, gl.COMPILE_STATUS)) {
        debug("Could not compile fragment shader:\n\n" + gl.getShaderInfoLog(raytracer.fragment_shader))
        return false
    }

    raytracer.program = gl.createProgram()
    gl.attachShader(raytracer.program, raytracer.vertex_shader)
    gl.attachShader(raytracer.program, raytracer.fragment_shader)

    raytracer.pos_attrib = 0
    raytracer.texcoord_attrib = 1

    gl.bindAttribLocation(raytracer.program, raytracer.pos_attrib, "pos")
    gl.bindAttribLocation(raytracer.program, raytracer.texcoord_attrib, "vtex")

    gl.linkProgram(raytracer.program)
    if(!gl.getProgramParameter(raytracer.program, gl.LINK_STATUS)) {
        debug("Could not link:\n" + gl.getProgramInfoLog(raytracer.program))
        return false
    }
    return true
}

function create_data_texture(gl, raytracer)
{
    var texture = gl.createTexture()

    gl.bindTexture(gl.TEXTURE_2D, texture)

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

    return texture
}

function init_raytracing_program(gl)
{
    raytracer = {}
    if(!load_shaders(gl, raytracer))
    return false

    gl.useProgram(raytracer.program)

    raytracer.modelview_uniform = gl.getUniformLocation(raytracer.program, "modelview")

    raytracer.sphere_geometry_uniform = gl.getUniformLocation(raytracer.program, "sphere_geometry")
    raytracer.sphere_colors_uniform = gl.getUniformLocation(raytracer.program, "sphere_colors")

    raytracer.group_children_uniform = gl.getUniformLocation(raytracer.program, "group_children")
    raytracer.group_objects_uniform = gl.getUniformLocation(raytracer.program, "group_objects")
    raytracer.group_hitmiss_uniform = gl.getUniformLocation(raytracer.program, "group_hitmiss")
    raytracer.group_boxmin_uniform = gl.getUniformLocation(raytracer.program, "group_boxmin")
    raytracer.group_boxmax_uniform = gl.getUniformLocation(raytracer.program, "group_boxmax")

    raytracer.sphere_data_row_size_uniform = gl.getUniformLocation(raytracer.program, "sphere_data_row_size")
    raytracer.sphere_data_rows_uniform = gl.getUniformLocation(raytracer.program, "sphere_data_rows")
    raytracer.group_data_row_size_uniform = gl.getUniformLocation(raytracer.program, "group_data_row_size")
    raytracer.group_data_rows_uniform = gl.getUniformLocation(raytracer.program, "group_data_rows")
    raytracer.which_uniform = gl.getUniformLocation(raytracer.program, "which")
    raytracer.tree_root_uniform = gl.getUniformLocation(raytracer.program, "tree_root")
    raytracer.light_dir_uniform = gl.getUniformLocation(raytracer.program, "light_dir")
    raytracer.eye_uniform = gl.getUniformLocation(raytracer.program, "eye")
    raytracer.camera_matrix_uniform = gl.getUniformLocation(raytracer.program, "camera_matrix")
    raytracer.camera_normal_matrix_uniform = gl.getUniformLocation(raytracer.program, "camera_normal_matrix")
    raytracer.object_matrix_uniform = gl.getUniformLocation(raytracer.program, "object_matrix")
    raytracer.object_inverse_uniform = gl.getUniformLocation(raytracer.program, "object_inverse")
    raytracer.object_normal_matrix_uniform = gl.getUniformLocation(raytracer.program, "object_normal_matrix")
    raytracer.object_normal_inverse_uniform = gl.getUniformLocation(raytracer.program, "object_normal_inverse")
    raytracer.fov_uniform = gl.getUniformLocation(raytracer.program, "fov")
    raytracer.aspect_uniform = gl.getUniformLocation(raytracer.program, "aspect")
    raytracer.background_color_uniform = gl.getUniformLocation(raytracer.program, "background_color")

    init_decal_geometry(gl, raytracer)

    raytracer.sphere_geometry_texture = create_data_texture(gl, raytracer)
    raytracer.sphere_colors_texture = create_data_texture(gl, raytracer)
    raytracer.group_children_texture = create_data_texture(gl, raytracer)
    raytracer.group_objects_texture = create_data_texture(gl, raytracer)
    raytracer.group_hitmiss_texture = create_data_texture(gl, raytracer)
    raytracer.group_boxmin_texture = create_data_texture(gl, raytracer)
    raytracer.group_boxmax_texture = create_data_texture(gl, raytracer)

    return raytracer
}

function load_scene_data(scene_data, gl, raytracer)
{
    gl.useProgram(raytracer.program)

    gl.bindTexture(gl.TEXTURE_2D, raytracer.sphere_geometry_texture)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, scene_data.row_pad, scene_data.sphere_data_rows, 0, gl.RGBA, gl.FLOAT, scene_data.sphere_geometries)

    gl.bindTexture(gl.TEXTURE_2D, raytracer.sphere_colors_texture)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, scene_data.row_pad, scene_data.sphere_data_rows, 0, gl.RGB, gl.FLOAT, scene_data.sphere_colors)

    gl.bindTexture(gl.TEXTURE_2D, raytracer.group_children_texture)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, scene_data.row_pad, scene_data.group_data_rows, 0, gl.RGB, gl.FLOAT, scene_data.group_children)

    gl.bindTexture(gl.TEXTURE_2D, raytracer.group_objects_texture)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, scene_data.row_pad, scene_data.group_data_rows, 0, gl.RGB, gl.FLOAT, scene_data.group_objects)
    
    gl.bindTexture(gl.TEXTURE_2D, raytracer.group_hitmiss_texture)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, scene_data.row_pad, scene_data.group_data_rows, 0, gl.RGB, gl.FLOAT, scene_data.group_hitmiss)

    gl.bindTexture(gl.TEXTURE_2D, raytracer.group_boxmin_texture)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, scene_data.row_pad, scene_data.group_data_rows, 0, gl.RGB, gl.FLOAT, scene_data.group_boxmin)

    gl.bindTexture(gl.TEXTURE_2D, raytracer.group_boxmax_texture)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, scene_data.row_pad, scene_data.group_data_rows, 0, gl.RGB, gl.FLOAT, scene_data.group_boxmax)

    gl.bindTexture(gl.TEXTURE_2D, null)

    return true
}

function bind_texture(gl, unit, texture, uniform)
{
    gl.activeTexture(gl.TEXTURE0 + unit)
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.uniform1i(uniform, unit)
}

identity_Matrix4fv = new Float32Array([
    1.0, 0.0, 0.0, 0.0,
    0.0, 1.0, 0.0, 0.0,
    0.0, 0.0, 1.0, 0.0,
    0.0, 0.0, 0.0, 1.0])

framerate_keep = 10
framerate_history = []
framerate_average = -1
framerate_last_date = new Date()

raytracer = {}
 
function reset_framerate()
{
    framerate_history = []
    framerate_average = -1
    framerate_last_date = new Date()
}

function add_framerate(d)
{
    var millis = d - framerate_last_date
    if(framerate_history.length == 0) {
        for(i = 0; i < framerate_keep; i++)
            framerate_history.push(millis)
        framerate_average = millis
    }
    var prev = framerate_history.shift()
    framerate_average -= prev / framerate_keep
    framerate_history.push(millis)
    framerate_average += millis / framerate_keep
    framerate_last_date = d
}

function draw_scene(gl, raytracer, scene_data, quiet)
{
    // var started = new Date()
    // var ended = new Date()
    // debug("ended - started = " + (ended - started))
    gl.useProgram(raytracer.program)

    var rendering = document.getElementById("rendering")
    gl.viewport(0, 0, rendering.width, rendering.height)

    var which_texture = 0

    bind_texture(gl, which_texture++, raytracer.sphere_geometry_texture, raytracer.sphere_geometry_uniform)
    bind_texture(gl, which_texture++, raytracer.sphere_colors_texture, raytracer.sphere_colors_uniform)

    bind_texture(gl, which_texture++, raytracer.group_objects_texture, raytracer.group_objects_uniform)
    bind_texture(gl, which_texture++, raytracer.group_hitmiss_texture, raytracer.group_hitmiss_uniform)
    bind_texture(gl, which_texture++, raytracer.group_children_texture, raytracer.group_children_uniform)
    bind_texture(gl, which_texture++, raytracer.group_boxmin_texture, raytracer.group_boxmin_uniform)
    bind_texture(gl, which_texture++, raytracer.group_boxmax_texture, raytracer.group_boxmax_uniform)

    gl.uniform1i(raytracer.tree_root_uniform, scene_data.tree_root)
    gl.uniform1i(raytracer.sphere_data_row_size_uniform, scene_data.row_pad)
    gl.uniform1i(raytracer.sphere_data_rows_uniform, scene_data.sphere_data_rows)
    gl.uniform1i(raytracer.group_data_row_size_uniform, scene_data.row_pad)
    gl.uniform1i(raytracer.group_data_rows_uniform, scene_data.group_data_rows)
    gl.uniform3f(raytracer.eye_uniform, scene_data.eye.X, scene_data.eye.Y, scene_data.eye.Z)
    gl.uniform1f(raytracer.fov_uniform, scene_data.fov)
    gl.uniform1f(raytracer.aspect_uniform, 1.0)
    gl.uniform3f(raytracer.background_color_uniform, scene_data.background[0], scene_data.background[1], scene_data.background[2])

    gl.bindBuffer(gl.ARRAY_BUFFER, raytracer.vert_buffer)
    gl.vertexAttribPointer(raytracer.pos_attrib, 4, gl.FLOAT, gl.FALSE, 0, 0)
    gl.enableVertexAttribArray(raytracer.pos_attrib)

    gl.bindBuffer(gl.ARRAY_BUFFER, raytracer.texcoord_buffer)
    gl.vertexAttribPointer(raytracer.texcoord_attrib, 2, gl.FLOAT, gl.FALSE, 0, 0)
    gl.enableVertexAttribArray(raytracer.texcoord_attrib)

    gl.uniformMatrix4fv(raytracer.camera_matrix_uniform, gl.FALSE, scene_data.camera_matrix)
    gl.uniformMatrix4fv(raytracer.camera_normal_matrix_uniform, gl.FALSE, scene_data.camera_normal_matrix)
    gl.uniformMatrix4fv(raytracer.object_matrix_uniform, gl.FALSE, scene_data.object_matrix)
    gl.uniformMatrix4fv(raytracer.object_inverse_uniform, gl.FALSE, scene_data.object_inverse)
    gl.uniformMatrix4fv(raytracer.object_normal_matrix_uniform, gl.FALSE, scene_data.object_normal_matrix)
    gl.uniformMatrix4fv(raytracer.object_normal_inverse_uniform, gl.FALSE, scene_data.object_normal_inverse)

    gl.uniformMatrix4fv(raytracer.modelview_uniform, gl.FALSE, identity_Matrix4fv)
    gl.uniform4f(raytracer.light_dir_uniform, light_dir.X, light_dir.Y, light_dir.Z, 0)

    gl.clearColor(1, 0, 0, 1)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    // gl.finish() /* Chrome stutters really badly without this */
    var err = gl.getError() // another way to force browser to flush
    if(err != gl.NONE)
        debug("GL Error : " + err)
    add_framerate(new Date)
    if(!quiet) {
        document.getElementById("fps").innerHTML = (1000 / framerate_average).toFixed(2) + " fps"
    }
}

buttondown = false

ox = 0
oy = 0

var requestAnimationFrame = window.requestAnimationFrame ||
    window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame ||
    window.msRequestAnimationFrame
    window.requestAnimationFrame = requestAnimationFrame

redraw_timer = false

function mousedown(gl, raytracer, scene_data, ev)
{
    buttondown = true
    ox = ev.layerX
    oy = ev.layerY
    reset_framerate()
    redraw_timer = setInterval(function(){ draw_scene(gl, raytracer, scene_data) }, 15)
}

function mouseup(gl, raytracer, scene_data, ev)
{
    buttondown = false
    if(redraw_timer) { clearInterval(redraw_timer); redraw_timer = false; draw_scene(gl, raytracer, scene_data) }
}

function mouseout(gl, raytracer, scene_data, ev)
{
    buttondown = false
    if(redraw_timer) { clearInterval(redraw_timer); redraw_timer = false; draw_scene(gl, raytracer, scene_data) }
}

ROTATE_OBJECT=1
ROTATE_LIGHT=2
ZOOM_OBJECT=3
motion_target = ROTATE_OBJECT

// XXX for debugging 11/8/2013
function keydown(gl, raytracer, scene_data, ev)
{
    if(String.fromCharCode(ev.keyCode) == 'A') {
        scene_data.fov *= 1.05
        draw_scene(gl, raytracer, scene_data)
    }
    if(String.fromCharCode(ev.keyCode) == 'S') {
        scene_data.fov /= 1.05
        draw_scene(gl, raytracer, scene_data)
    }
}

function mousewheel(gl, raytracer, scene_data, ev)
{
    // delta regularization cribbed from http://www.javascriptkit.com/javatutors/onmousewheel.shtml
    var evt=window.event || ev //equalize event object
    var delta=evt.detail? evt.detail*(-120) : evt.wheelDelta //check for detail first so Opera uses that instead of wheelDelta

    while(Math.abs(delta) > 0) {
        step = (delta > 0) ? 120 : -120

        var dwheel = 4 / step // 4 empirically chosen 
        zoom *= Math.exp(dwheel)

        if(Math.abs(step) > Math.abs(delta))
            delta = 0
        else
            delta = delta - step
    }
    update_view_params(scene_data, zoom)
    draw_scene(gl, raytracer, scene_data)
    ev.preventDefault()
    ev.stopPropagation()
}

function mousemove(gl, raytracer, scene_data, ev)
{
    dx = ev.layerX - ox
    dy = ev.layerY - oy

    if(buttondown && ((dx != 0) || (dy != 0))) {
        var canvas = document.getElementById("rendering")
        if(motion_target == ZOOM_OBJECT) {
            zoom *= Math.exp(Math.log(5.0) / canvas.offsetHeight / 2 * -dy)
        } else if(motion_target == ROTATE_OBJECT) {
            object_rotation = trackball_motion(object_rotation, (dx / canvas.offsetWidth), (dy / canvas.offsetHeight))
        } else {
            // viewing coordinate system is left-handed, so using GL
            // rotation code for light is backwards.
            light_rotation = trackball_motion(light_rotation, -(dx / canvas.offsetWidth), -(dy / canvas.offsetHeight))
        }
        update_view_params(scene_data, zoom)
        update_light()

    // window.requestAnimationFrame(function() {draw_scene(gl, raytracer, scene_data)})
    }
    ox = ev.layerX
    oy = ev.layerY
}

function cleanup_after_failure(s)
{
    var rendering = document.getElementById("rendering")
    rendering.parentNode.removeChild(rendering)
    var interaction_panel = document.getElementById("interaction_panel")
    interaction_panel.parentNode.removeChild(interaction_panel)
    document.getElementById("info").innerHTML = s + '<br>Try <a href="http://get.webgl.org/troubleshooting/">this page</a> for troubleshooting.)'
}

function set_half_res()
{
    var rendering = document.getElementById("rendering")
    rendering.width = 256
    rendering.height = 256
    document.getElementById("resolution_list").selectedIndex = 0
    if(window.scene_data)
        draw_scene(window.gl, window.raytracer, window.scene_data)
}

function set_full_res()
{
    var rendering = document.getElementById("rendering")
    rendering.width = 512
    rendering.height = 512
    document.getElementById("resolution_list").selectedIndex = 1
    if(window.scene_data)
        draw_scene(window.gl, window.raytracer, window.scene_data)
}

function set_double_res()
{
    var rendering = document.getElementById("rendering")
    rendering.width = 1024
    rendering.height = 1024
    document.getElementById("resolution_list").selectedIndex = 2
    if(window.scene_data)
        draw_scene(window.gl, window.raytracer, window.scene_data)
}

// entire function cribbed from http://www.nczonline.net/blog/2009/07/28/the-best-way-to-load-external-javascript/
function load_script(url, callback){

    var script = document.createElement("script")
    script.type = "text/javascript";

    if (script.readyState){  //IE
        script.onreadystatechange = function(){
            if (script.readyState == "loaded" ||
                    script.readyState == "complete"){
                script.onreadystatechange = null;
                callback();
            }
        };
    } else {  //Others
        script.onload = function(){
            callback();
        };
    }

    script.src = "js/"+url;
    document.getElementsByTagName("head")[0].appendChild(script);
}

function addListener(element, what, func, sendup)
{
    if (document.attachEvent) //if IE (and Opera depending on user setting)
        element.attachEvent("on"+what, func)
    else if (document.addEventListener) //WC3 browsers
        element.addEventListener(what, func, true, sendup)
}

function removeListener(element, what, func)
{
    if (document.attachEvent) //if IE (and Opera depending on user setting)
        element.detachEvent("on"+what, func)
    else if (document.addEventListener) //WC3 browsers
        element.removeEventListener(what, func, true)
}

function disable_interaction()
{
    document.getElementById("interaction_list").disabled = true
    document.getElementById("resolution_list").disabled = true
    document.getElementById("models_list").disabled = true

    var rendering = document.getElementById("rendering")
    if(document.mousedown) {
        removeListener(rendering, "mousedown", document.mousedown)
        removeListener(rendering, "mousemove", document.mousemove)
        removeListener(rendering, "mouseup", document.mouseup)
        removeListener(rendering, "mouseout", document.mouseout)
        removeListener(rendering, window.mousewheelevt, document.mousewheel)
        document.mousedown = false
    }
}

function enable_interaction(gl, raytracer, scene_data)
{
    var rendering = document.getElementById("rendering")

// XXX for debugging 2013/8/11
    document.onkeydown = function(ev){keydown(gl, raytracer, scene_data, ev)}

    document.mousedown = function(ev){mousedown(gl, raytracer, scene_data, ev)}
    document.mousemove = function(ev){mousemove(gl, raytracer, scene_data, ev)}
    document.mouseup = function(ev){mouseup(gl, raytracer, scene_data, ev)}
    document.mouseout = function(ev){mouseout(gl, raytracer, scene_data, ev)}
    document.mousewheel = function(ev){mousewheel(gl, raytracer, scene_data, ev)}
    addListener(rendering, "mousedown", document.mousedown, true)
    addListener(rendering, "mousemove", document.mousemove, true)
    addListener(rendering, "mouseup", document.mouseup, true)
    addListener(rendering, "mouseout", document.mouseout, true)

    addListener(rendering, window.mousewheelevt, document.mousewheel, false)

    rendering.ondragstart = function() { return false }

    document.getElementById("interaction_list").disabled = false
    document.getElementById("resolution_list").disabled = false
    document.getElementById("models_list").disabled = false
}

function finish_successful_model_load(name)
{
    scene_data.name = name

    var rendering = document.getElementById("rendering")
    var gl = window.gl
    success = load_scene_data(scene_data, gl, raytracer)
    if(!success){
        cleanup_after_failure('Could not initialize WebGL with application data. Please email <a href="mailto:grantham@plunk.org">Brad</a>.')
        return
    }

    update_view_params(scene_data, zoom)
    update_light()

    enable_interaction(gl, raytracer, scene_data)

    draw_scene(gl, raytracer, scene_data)
}

function start_model_load(name)
{
    disable_interaction()
    scene_data = {}
    document.getElementById("models_list").selectedIndex = model_list[name].index
    load_script(name, function() {finish_successful_model_load(name)} )
}

model_list = {
    "one.js" : {name: "One"},
    "caffeine.js" : {name: "Caffeine"},
    "dna.js" : {name: "DNA fragment"},
    "gears.js" : {name: "Atomic Gears"},
    "inits.js" : {name: "Brad's Initials"},
    "large-bearing.js" : {name: "Molecular Bearing"},
    "sortingpump.js" : {name: "Molecular Sorting Pump"},
    "sphereflake.js" : {name: "SphereFlake"},
    "tbv.js" : {name: "Tomato Bushy Virus"},
}

function finish_characterization(name)
{
    var rendering = document.getElementById("rendering")
    var gl = window.gl

    draw_scene(gl, raytracer, scene_data, true)
    var pixelValues = new Uint8Array(4);
    gl.readPixels(10, 35, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixelValues);

    var test_frames = 20
    var started = new Date()
    for(var i = 0; i < test_frames; i++) {
        draw_scene(gl, raytracer, scene_data, true)
    }
    var pixelValues = new Uint8Array(4);
    gl.readPixels(10, 35, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixelValues);
    var ended = new Date()
    var millis = (ended.getTime() - started.getTime())
    var fps = (test_frames / (millis / 1000))
    // debug(test_frames + "x of " + name + " yields " + fps + " fps")

    if(fps > 857) {
        set_double_res()
        start_model_load("sorting_pump.js")
    } else if(fps > 414) {
        set_double_res()
        start_model_load("gears.js")
    } else if(fps > 353) {
        set_double_res()
        start_model_load("tbv.js")
    } else if(fps > 214) {
        set_double_res()
        start_model_load("sphereflake.js")
    } else if(fps > 82) {
        start_model_load("large-bearing.js")
    } else if(fps > 22) {
        start_model_load("dna.js")
    } else if(fps > 10) {
        set_half_res()
        start_model_load("dna.js")
    } else if(fps > 6) {
        start_model_load("caffeine.js")
    } else if(fps > 2.86) {
        set_half_res()
        start_model_load("caffeine.js")
    } else if(fps > 2.00) {
        set_half_res()
        start_model_load("dna.js")
    } else {
        alert("This page calculated that this raytracer will be very slow on your configuration. Don't expect models to be interactive.")
        set_half_res()
        start_model_load("inits.js")
    }
}

function continue_characterization(name)
{
    scene_data = window.scene_data
    console.log("loading " + name + " for characterization")
    scene_data.name = name

    var rendering = document.getElementById("rendering")
    var gl = window.gl
    success = load_scene_data(scene_data, gl, raytracer)
    if(!success){
        cleanup_after_failure('Could not initialize WebGL with application data. Please email <a href="mailto:grantham@plunk.org">Brad</a>.')
        return
    }

    update_view_params(scene_data, zoom)
    update_light()

    draw_scene(gl, raytracer, scene_data, true)
    gl.finish()

    setTimeout(function(){finish_characterization(name)}, 100)
}

function start_characterization(name)
{
    disable_interaction()
    load_script(name, function() {continue_characterization(name)} )
}

function change_interaction()
{
    interaction_list = document.getElementById("interaction_list")
    selection = interaction_list.selectedIndex
    value = interaction_list.options[selection].value
    if(value == "rotate_object")
        motion_target = ROTATE_OBJECT
    else if(value == "zoom_object")
        motion_target = ZOOM_OBJECT
    else if(value == "rotate_light")
        motion_target = ROTATE_LIGHT
}

function change_resolution()
{
    resolution_list = document.getElementById("resolution_list")
    selection = resolution_list.selectedIndex
    value = resolution_list.options[selection].value
    if(value == "half")
        set_half_res()
    else if(value == "full")
        set_full_res()
    else if(value == "double")
        set_double_res()
}

function change_model()
{
    models_list = document.getElementById("models_list")
    selection = models_list.selectedIndex
    start_model_load(models_list.options[selection].value)
}

function init()
{
    // cribbed next line from http://www.javascriptkit.com/javatutors/onmousewheel.shtml
    window.mousewheelevt=(/Firefox/i.test(navigator.userAgent))? "DOMMouseScroll" : "mousewheel" //FF doesn't recognize mousewheel as of FF3.x

    models_list = document.getElementById("models_list")
    var index = 0
    for(var file in model_list) {
        var option = document.createElement("option");
        option.value = file
        option.text = model_list[file]['name']
        model_list[file].index = index
        models_list.add(option)
        index ++
    }
     
    zoom = 1.0
    disable_interaction()

    light_rotation[0] = to_radians(20.0)
    light_rotation[1] = .707
    light_rotation[2] = -.707
    light_rotation[3] = 0

    var success = false
    var rendering = document.getElementById("rendering")
    try {
        var gl = rendering.getContext("experimental-webgl", {preserveDrawingBuffer: true})
        window.gl = gl
        if (!gl) {
            cleanup_after_failure('Could not initialize WebGL.  Does your web browser support WebGL?')
            return
        }

    alw = gl.getParameter(gl.ALIASED_LINE_WIDTH_RANGE)
    probably_angle = (alw[0] == 1) && (alw[1] == 1)
    is_windows = navigator.platform=="Win32"
    is_chrome = false
    is_firefox = false
    if ((v=navigator.userAgent.indexOf("Chrome"))!=-1) {
        is_chrome = true
        ver = navigator.userAgent.substring(v+7)
        chromemajor = ver.substring(0,ver.indexOf("."))
    }
    if ((v=navigator.userAgent.indexOf("Firefox"))!=-1) {
        is_firefox = true
        ver = navigator.userAgent.substring(v+8)
        firefoxmajor = ver.substring(0,ver.indexOf("."))
    }

    chrome_angle_link_timeout = probably_angle && is_windows && is_chrome && (chromemajor <= 30)
        if(chrome_angle_link_timeout) {
        gRayTracingFragmentShaderText = gRayTracingFragmentShaderText.replace("max_bvh_iterations = 400","max_bvh_iterations = 150")
        document.getElementById("rendering_info").style.width = "320px"
        document.getElementById("rendering_info").innerHTML = '<center>Your Browser appears to be a Windows version of Chrome using ANGLE.<br><br>The raytracer inner loop has been truncated to avoid a link timeout and rendering may show artifacts.<br><br>Try restarting Chrome from the command-line with the parameter <code>"--use-gl=desktop"</code> for the full shader, but my experience was that native GL was substantially slower to render.  See also <a href="http://www.geeks3d.com/20130611/webgl-how-to-enable-native-opengl-in-your-browser-windows/">this page.</a></center>'
    }
    firefox_webgl_hang = is_windows && is_firefox && (firefoxmajor >= 24)
    if(firefox_webgl_hang) {
            cleanup_after_failure('This script detected Windows Firefox version 24 or later, and at Firefox 24 or later on Windows hangs running this shader.  Therefore the raytracer is disabled, sorry.  Please see <a href="https://bugzilla.mozilla.org/show_bug.cgi?id=919886">Firefox issue 919886</a>')
        return
    }

        var tf = gl.getExtension("OES_texture_float")
        if(!tf) {
            cleanup_after_failure('This application requires the WebGL "OES_texture_float" extension, but your browser or platform doesn\'t offer that extension.')
            return
        }
    } catch (err) {
        debug(err)
        cleanup_after_failure('Could not initialize WebGL.  Does your web browser support WebGL?')
        return
    }

    window.raytracer = init_raytracing_program(gl)
    if(!window.raytracer){
        cleanup_after_failure('Could not initialize WebGL with shaders. Please email <a href="mailto:grantham@plunk.org">Brad</a>.')
        return
    }

    start_characterization("caffeine.js")
}
