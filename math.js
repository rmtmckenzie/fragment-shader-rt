function to_radians(d)
{
    return d / 180 * 3.141596
}

function vec3(x, y, z)
{
    var v = {}
    v.X = x
    v.Y = y
    v.Z = z
    return v
}

function vec4(x, y, z, w)
{
    var v = {}
    v.X = x
    v.Y = y
    v.Z = z
    v.W = w
    return v
}

function vec3_subtract(v1, v2)
{
    return vec3(v1.X - v2.X, v1.Y - v2.Y, v1.Z - v2.Z)
}

function vec3_add(v1, v2)
{
    return vec3(v1.X + v2.X, v1.Y + v2.Y, v1.Z + v2.Z)
}

function vec3_divide(v, d)
{
    return vec3(v.X / d, v.Y / d, v.Z / d)
}

function vec3_multiply(v, d)
{
    return vec3(v.X * d, v.Y * d, v.Z * d)
}

function vec3_dot(v1, v2)
{
    return v1.X * v2.X + v1.Y * v2.Y + v1.Z * v2.Z
}

function mat4_mult_vec4(m, v)
{
    var t = [0, 0, 0, 0]

    for(i = 0; i < 4; i++)
    t[i] =
        m[0 + i] * v.X + 
        m[4 + i] * v.Y + 
        m[8 + i] * v.Z + 
        m[12 + i] * v.W

    return vec4(t[0], t[1], t[2], t[3])
}

function mat4_make_identity()
{
    return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]
}

function mat4_determinant(mat)
{
    return (mat[0] * mat[5] - mat[1] * mat[4]) *
        (mat[10] * mat[15] - mat[11] * mat[14]) + 
        (mat[2] * mat[4] - mat[0] * mat[6]) *
    (mat[9] * mat[15] - mat[11] * mat[13]) + 
        (mat[0] * mat[7] - mat[3] * mat[4]) *
    (mat[9] * mat[14] - mat[10] * mat[13]) + 
        (mat[1] * mat[6] - mat[2] * mat[5]) *
    (mat[8] * mat[15] - mat[11] * mat[12]) + 
        (mat[3] * mat[5] - mat[1] * mat[7]) *
    (mat[8] * mat[14] - mat[10] * mat[12]) + 
        (mat[2] * mat[7] - mat[3] * mat[6]) *
    (mat[8] * mat[13] - mat[9] * mat[12])
}

function mat4_transpose(mat)
{
    var result = mat4_make_identity()

    for(i = 0; i < 4; i++)
    for(j = 0; j < 4; j++) 
        result[i + j * 4] = mat[j + i *4] 

    return result
}

function mat4_copy(m)
{
    return [m[0], m[1], m[2], m[3],
       m[4], m[5], m[6], m[7],
       m[8], m[9], m[10], m[11],
       m[12], m[13], m[14], m[15]]
}

function mat4_invert(mat)
{
    var EPSILON = .00001

    var hold = mat4_copy(mat)
    var inv = mat4_make_identity()
    var det = mat4_determinant(mat)
    if(Math.abs(det) < EPSILON) /* singular? */ {
        debug("singular")
    return
    }

    var rswap = 0
    /* this loop isn't entered unless [0 + 0] > EPSILON and det > EPSILON,
     so rswap wouldn't be 0, but I initialize so as not to get warned */
    if(Math.abs(hold[0]) < EPSILON)
    {
        if(Math.abs(hold[1]) > EPSILON)
            rswap = 1
        else if(Math.abs(hold[2]) > EPSILON)
        rswap = 2
        else if(Math.abs(hold[3]) > EPSILON)
        rswap = 3

        for(i = 0; i < 4; i++)
    {
            swap = hold[i * 4 + 0]
            hold[i * 4 + 0] = hold[i * 4 + rswap]
            hold[i * 4 + rswap] = swap

            swap = inv[i * 4 + 0]
            inv[i * 4 + 0] = inv[i * 4 + rswap]
            inv[i * 4 + rswap] = swap
        }
    }
        
    div = hold[0]
    for(i = 0; i < 4; i++)
    {
        hold[i * 4 + 0] /= div
        inv[i * 4 + 0] /= div
    }

    div = hold[1]
    for(i = 0; i < 4; i++)
    {
        hold[i * 4 + 1] -= div * hold[i * 4 + 0]
        inv[i * 4 + 1] -= div * inv[i * 4 + 0]
    }
    div = hold[2]
    for(i = 0; i < 4; i++)
    {
        hold[i * 4 + 2] -= div * hold[i * 4 + 0]
        inv[i * 4 + 2] -= div * inv[i * 4 + 0]
    }
    div = hold[3]
    for(i = 0; i < 4; i++)
    {
        hold[i * 4 + 3] -= div * hold[i * 4 + 0]
        inv[i * 4 + 3] -= div * inv[i * 4 + 0]
    }

    if(Math.abs(hold[5]) < EPSILON){
        if(Math.abs(hold[6]) > EPSILON)
        rswap = 2
        else if(Math.abs(hold[7]) > EPSILON)
        rswap = 3

        for(i = 0; i < 4; i++)
    {
            swap = hold[i * 4 + 1]
            hold[i * 4 + 1] = hold[i * 4 + rswap]
            hold[i * 4 + rswap] = swap

            swap = inv[i * 4 + 1]
            inv[i * 4 + 1] = inv[i * 4 + rswap]
            inv[i * 4 + rswap] = swap
        }
    }

    div = hold[5]
    for(i = 0; i < 4; i++)
    {
        hold[i * 4 + 1] /= div
        inv[i * 4 + 1] /= div
    }

    div = hold[4]
    for(i = 0; i < 4; i++)
    {
        hold[i * 4 + 0] -= div * hold[i * 4 + 1]
        inv[i * 4 + 0] -= div * inv[i * 4 + 1]
    }
    div = hold[6]
    for(i = 0; i < 4; i++)
    {
        hold[i * 4 + 2] -= div * hold[i * 4 + 1]
        inv[i * 4 + 2] -= div * inv[i * 4 + 1]
    }
    div = hold[7]
    for(i = 0; i < 4; i++)
    {
        hold[i * 4 + 3] -= div * hold[i * 4 + 1]
        inv[i * 4 + 3] -= div * inv[i * 4 + 1]
    }

    if(Math.abs(hold[10]) < EPSILON){
        for(i = 0; i < 4; i++)
    {
            swap = hold[i * 4 + 2]
            hold[i * 4 + 2] = hold[i * 4 + 3]
            hold[i * 4 + 3] = swap

            swap = inv[i * 4 + 2]
            inv[i * 4 + 2] = inv[i * 4 + 3]
            inv[i * 4 + 3] = swap
        }
    }

    div = hold[10]
    for(i = 0; i < 4; i++)
    {
        hold[i * 4 + 2] /= div
        inv[i * 4 + 2] /= div
    }

    div = hold[8]
    for(i = 0; i < 4; i++)
    {
        hold[i * 4 + 0] -= div * hold[i * 4 + 2]
        inv[i * 4 + 0] -= div * inv[i * 4 + 2]
    }
    div = hold[9]
    for(i = 0; i < 4; i++)
    {
        hold[i * 4 + 1] -= div * hold[i * 4 + 2]
        inv[i * 4 + 1] -= div * inv[i * 4 + 2]
    }
    div = hold[11]
    for(i = 0; i < 4; i++)
    {
        hold[i * 4 + 3] -= div * hold[i * 4 + 2]
        inv[i * 4 + 3] -= div * inv[i * 4 + 2]
    }

    div = hold[15]
    for(i = 0; i < 4; i++)
    {
        hold[i * 4 + 3] /= div
        inv[i * 4 + 3] /= div
    }

    div = hold[12]
    for(i = 0; i < 4; i++)
    {
        hold[i * 4 + 0] -= div * hold[i * 4 + 3]
        inv[i * 4 + 0] -= div * inv[i * 4 + 3]
    }
    div = hold[13]
    for(i = 0; i < 4; i++)
    {
        hold[i * 4 + 1] -= div * hold[i * 4 + 3]
        inv[i * 4 + 1] -= div * inv[i * 4 + 3]
    }
    div = hold[14]
    for(i = 0; i < 4; i++)
    {
        hold[i * 4 + 2] -= div * hold[i * 4 + 3]
        inv[i * 4 + 2] -= div * inv[i * 4 + 3]
    }
    
    return inv
}


function mat4_make_translation(x, y, z)
{
    var matrix = mat4_make_identity()
    matrix[12] = x
    matrix[13] = y
    matrix[14] = z
    return matrix
}

function mat4_make_scale(x, y, z)
{
    var matrix = mat4_make_identity()
    matrix[0] = x
    matrix[5] = y
    matrix[10] = z
    return matrix
}

function mat4_mult(m1, m2)
{
    var t = mat4_make_identity()

    for(j = 0; j < 4; j++)
    for(i = 0; i < 4; i++)
           t[i * 4 + j] = m1[i * 4 + 0] * m2[0 * 4 + j] +
           m1[i * 4 + 1] * m2[1 * 4 + j] +
           m1[i * 4 + 2] * m2[2 * 4 + j] +
           m1[i * 4 + 3] * m2[3 * 4 + j]

    return t
}

function mat4_get_rotation(m)
{
    var cosine = (m[0] + m[5] + m[10] - 1.0) / 2.0

    if(cosine > 1.0){
    cosine = 1.0
    }
    if(cosine < -1.0){
    cosine = -1.0
    }

    var r = [0, 0, 0, 1]

    r[0] = Math.acos(cosine)

    r[1] = (m[6] - m[9])
    r[2] = (m[8] - m[2])
    r[3] = (m[1] - m[4])

    var d = Math.sqrt(r[1] * r[1] +
    r[2] * r[2] +
    r[3] * r[3])

    r[1] /= d
    r[2] /= d
    r[3] /= d

    return r
}


function mat4_make_rotation(a, x, y, z)
{
    var c = Math.cos(a)
    var s = Math.sin(a)
    var t = 1.0 - c

    var matrix = mat4_make_identity()

    matrix[0] = t * x * x + c
    matrix[1] = t * x * y + s * z
    matrix[2] = t * x * z - s * y
    matrix[3] = 0

    matrix[4] = t * x * y - s * z
    matrix[5] = t * y * y + c
    matrix[6] = t * y * z + s * x
    matrix[7] = 0

    matrix[8] = t * x * z + s * y
    matrix[9] = t * y * z - s * x
    matrix[10] = t * z * z + c
    matrix[11] = 0

    matrix[12] = 0
    matrix[13] = 0
    matrix[14] = 0
    matrix[15] = 1

    return matrix
}

function rotation_mult_rotation(rotation1, rotation2)
{
    var matrix1 = mat4_make_rotation(rotation1[0], rotation1[1], rotation1[2],
        rotation1[3])
    var matrix2 = mat4_make_rotation(rotation2[0], rotation2[1], rotation2[2],
        rotation2[3])
    var matrix3 = mat4_mult(matrix2, matrix1)
    return mat4_get_rotation(matrix3)
}