//
// template-rt.cpp
//

#define _CRT_SECURE_NO_WARNINGS
#include "matm.h"
#include <iostream>
#include <fstream>
#include <sstream>
#include <string>
#include <vector>
#include <iomanip>
using namespace std;

int g_width;
int g_height;
vector<vec4> g_colors;

float g_left;
float g_right;
float g_top;
float g_bottom;
float g_near;

vec3 IAmbient;
vec3 bgColor;
string outfile;

struct Ray
{
    vec4 origin;
    vec4 dir;
};

struct Sphere
{
    string name;
    vec4 pos;
    vec3 scale;
    vec3 color;
    vec4 K;
    int n;
    mat4 inverseTransform;
};

struct Light
{
    string name;
    vec4 pos;
    vec3 Icolor;
};

vector<Sphere> spheres;
vector<Light> lights; 
// -------------------------------------------------------------------
// Input file parsing

vec4 toVec4(const string& s1, const string& s2, const string& s3)
{
    stringstream ss(s1 + " " + s2 + " " + s3);
    vec4 result;
    ss >> result.x >> result.y >> result.z;
    result.w = 1.0f;
    return result;
}

float toFloat(const string& s)
{
    stringstream ss(s);
    float f;
    ss >> f;
    return f;
}

void parseLine(const vector<string>& vs)
{
    if (vs[0] == "RES")
    {
        g_width = (int)toFloat(vs[1]);
        g_height = (int)toFloat(vs[2]);
        g_colors.resize(g_width * g_height);
    }
    else if (vs[0] == "NEAR")
        g_near = toFloat(vs[1]);
    else if (vs[0] == "LEFT")
        g_left = toFloat(vs[1]);
    else if (vs[0] == "RIGHT")
        g_right = toFloat(vs[1]);
    else if (vs[0] == "BOTTOM")
        g_bottom = toFloat(vs[1]);
    else if (vs[0] == "TOP")
        g_top = toFloat(vs[1]);
    else if (vs[0] == "SPHERE")
    {   
        Sphere s;
        s.name = vs[1];
        s.pos = vec4(toFloat(vs[2]), toFloat(vs[3]), toFloat(vs[4]), 1);
        s.scale = vec3(toFloat(vs[5]), toFloat(vs[6]), toFloat(vs[7]));
        //create the inverse matrix
        mat4 scaling = Scale(s.scale);
        InvertMatrix(scaling, s.inverseTransform);

        s.color = vec3(toFloat(vs[8]), toFloat(vs[9]), toFloat(vs[10]));
        s.K = vec4(toFloat(vs[11]), toFloat(vs[12]), toFloat(vs[13]), toFloat(vs[14])); //Ka, Kd, Ks, Kr
        s.n = toFloat(vs[15]);
        spheres.push_back(s);
    }
    else if (vs[0] == "LIGHT")
    {
        Light l;
        l.name = vs[1];
        l.pos = vec4( toFloat(vs[2]), toFloat(vs[3]), toFloat(vs[4]), 1 );
        l.Icolor = vec3( toFloat(vs[5]), toFloat(vs[6]), toFloat(vs[7]) );
        lights.push_back(l);
    }
    else if (vs[0] == "BACK")
        bgColor = vec3(toFloat(vs[1]), toFloat(vs[2]), toFloat(vs[3]));
    else if (vs[0] == "AMBIENT")
        IAmbient = vec3(toFloat(vs[1]), toFloat(vs[2]), toFloat(vs[3])); //Ir, Ig, Ib
    else if (vs[0] == "OUTPUT")
        outfile = vs[1];
}

void loadFile(const char* filename)
{
    ifstream is(filename);
    if (is.fail())
    {
        cout << "Could not open file " << filename << endl;
        exit(1);
    }
    string s;
    vector<string> vs;
    while(!is.eof())
    {
        vs.clear();
        getline(is, s);
        istringstream iss(s);
        while (!iss.eof())
        {
            string sub;
            iss >> sub;
            vs.push_back(sub);
        }
        parseLine(vs);
    }
}

// -------------------------------------------------------------------
// Utilities

void setColor(int ix, int iy, const vec4& color)
{
    int iy2 = g_height - iy - 1; // Invert iy coordinate.
    g_colors[iy2 * g_width + ix] = color;
}


// -------------------------------------------------------------------
// Intersection routine
// Return the index of the closest intersecting sphere
int intersection(const Ray& ray, vec4& Point, bool& interior, bool refl)
{
    int sphereIndex = -1;
    float minimum_distance;
    // the minimum_distance is different for reflected rays
    if(refl)
        minimum_distance = 0.0001f;
    else
        minimum_distance = 1.0f;
    float minimum_time;
    float t1 = 0;
    float distance = 1000;

    for(int i = 0; i < spheres.size(); i++)
    {
        // Calculate the transformed ray
        vec4 intermediate = spheres[i].pos - ray.origin;
        vec4 Sinverse = spheres[i].inverseTransform * intermediate;
        vec4 Cinverse = spheres[i].inverseTransform * ray.dir;

        // Apply the quadratic formula
        float A = dot(Cinverse,Cinverse);
        float B = dot(Sinverse,Cinverse);
        float C = dot(Sinverse,Sinverse) - 1;

        float first = B/A; 
        float determ = B*B - A*C;
        interior = false; 

        if(determ >= 0)
        {
            float second = sqrt(determ) / A;
            // the two solutions to the quadratic equation
            float t1 = first - second;
            float t2 = first + second;
            // ignore intersection points that are closer to us than the nearplane
            if (t1 > minimum_distance || t2 > minimum_distance)
            {
                if( t1 > minimum_distance )
                {
                    if(sphereIndex == -1 || t1 < minimum_time) //short circuits if sphereIndex is -1
                    {
                        minimum_time = t1;
                        sphereIndex = i;
                        Point = ray.origin + t1 * ray.dir;
                        Point.w = 1;
                        interior = false;
                    }
                }
                if( t2 > minimum_distance )
                {
                    if(sphereIndex == -1 || t2 < minimum_time) //short circuits if sphereIndex is -1
                    {
                        minimum_time = t2;
                        sphereIndex = i;
                        Point = ray.origin + t2 * ray.dir;
                        Point.w = 1;
                        interior = true;
                    }
                }
            }
        }
    }
    return sphereIndex;
}

// -------------------------------------------------------------------
// Ray tracing

vec4 trace(const Ray& ray, int depth, bool refl)
{
    // prevent recursive calls of depth greater than 3
    if (depth > 3)
        return vec4(0,0,0,0); // return no color
    bool specular = true;
    vec4 Point = vec4(0.0f, 0.0f, 0.0f, 1.0f);
    int sphereIndex = intersection(ray, Point, specular, refl);

    // if there is no intersection
    if(sphereIndex == -1)
    {
        if(depth == 0)
            return bgColor;
        else
            return vec4(0,0,0,0); //recursive calls should return no color
    }
    Sphere s = spheres[sphereIndex];

    // Ray from point to the eye
    vec4 V = ray.origin - Point;
    V = normalize(V);

    // Find the normal
    vec4 N = Point - s.pos;
    N.w = 0; //change to vector
    N = normalize(s.inverseTransform * s.inverseTransform * N);

    // Local illumination
    vec4 pixelColor = vec4( s.K.x *  IAmbient * s.color );

    // For each light source, add diffuse and specular components
    for(int i = 0; i < lights.size(); i++)
    {
        Ray shadow;
        shadow.origin = Point;
        shadow.dir = normalize(lights[i].pos - Point);

        vec4 placeHolder = vec4(0,0,0,0);
        bool placeHolder2 = false;
        int shadowSphere = intersection(shadow, placeHolder, placeHolder2, refl);
        vec4 R;

        // Check if the ray from the point to the light is obstructed
        if(shadowSphere == -1) // if no intersection
        {
            // Ray from Point to Light
            vec4 L = lights[i].pos - Point;
            L = normalize(L);

            // Reflection vector
            vec4 R = 2 * N * dot(N, L) - L;
            R = normalize(R);

            float flip = dot(N, L);
            if (flip < 0)
                continue;

            pixelColor += lights[i].Icolor * s.K.y * dot(N, L) * s.color;

            if (!specular)
            {
                pixelColor += s.K.z * lights[i].Icolor * std::pow(dot(R, V), s.n);
            }
        }
    }

    // Compute the reflection ray
    Ray reflRay;
    reflRay.origin = Point;
    reflRay.dir = normalize(-2 * N * dot(N, ray.dir) + ray.dir);
    bool interior = false; 

    // Recursively calculate the color from the refleted ray
    vec4 colorFromReflection = trace(reflRay, depth+1, true);
    if(colorFromReflection != bgColor)
        pixelColor += s.K.w * colorFromReflection; 

    // Clamp the RGB values
    if (pixelColor.x > 1)
        pixelColor.x = 1;
    if (pixelColor.y > 1)
        pixelColor.y = 1;
    if (pixelColor.z > 1)
        pixelColor.z = 1;
    return pixelColor;
}

//turn screen space pixels into world space rays
vec4 getDir(int ix, int iy)
{
    float alpha = (float) ix / (float) (g_width);
    float beta = (float) iy / (float) (g_height);      
    float x = g_left + alpha * g_right - alpha * g_left;
    float y = g_bottom + beta * g_top - beta * g_bottom;
    vec4 dir = vec4(x, y, -1 * g_near, 0.0f);
    return dir;
}

void renderPixel(int ix, int iy)
{
    Ray ray;
    ray.origin = vec4(0.0f, 0.0f, 0.0f, 1.0f);
    ray.dir = getDir(ix, iy);
    vec4 color = trace(ray, 0, false);
    setColor(ix, iy, color);
}

void render()
{
    for (int iy = 0; iy < g_height; iy++)
        for (int ix = 0; ix < g_width; ix++)
            renderPixel(ix, iy);
}


// -------------------------------------------------------------------
// PPM saving

void savePPM(int Width, int Height, char* fname, unsigned char* pixels) 
{
    FILE *fp;
    const int maxVal=255;

    printf("Saving image %s: %d x %d\n", fname, Width, Height);
    fp = fopen(fname,"wb");
    if (!fp) {
        printf("Unable to open file '%s'\n", fname);
        return;
    }
    fprintf(fp, "P6\n");
    fprintf(fp, "%d %d\n", Width, Height);
    fprintf(fp, "%d\n", maxVal);

    for(int j = 0; j < Height; j++) {
        fwrite(&pixels[j*Width*3], 3, Width, fp);
    }

    fclose(fp);
}

void saveFile()
{
    // Convert color components from floats to unsigned chars.
    unsigned char* buf = new unsigned char[g_width * g_height * 3];
    for (int y = 0; y < g_height; y++)
        for (int x = 0; x < g_width; x++)
            for (int i = 0; i < 3; i++)
                buf[y*g_width*3+x*3+i] = (unsigned char)(((float*)g_colors[y*g_width+x])[i] * 255.9f);
    
    char* file = new char[outfile.length() + 1];
    strcpy(file, outfile.c_str());
    savePPM(g_width, g_height, file, buf);
    delete[] file;
    delete[] buf;
}


// -------------------------------------------------------------------
// Main

int main(int argc, char* argv[])
{
    if (argc < 2)
    {
        cout << "Usage: template-rt <input_file.txt>" << endl;
        exit(1);
    }
    loadFile(argv[1]);
    render();
    saveFile();
    return 0;
}
