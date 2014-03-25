uniform mat4 modelview;
attribute highp vec4 pos;
attribute highp vec2 vtex;
varying highp vec2 ftex;

void main()
{
    gl_Position = modelview * pos;
    ftex = vtex;
}