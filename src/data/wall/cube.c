#include <math.h>
#include <ncurses.h>
#include <stdlib.h>

#include "cube.h"
#include "debug.h"
#include "ncdraw.h"

static const double cam_distance = 50.0;
static const double zoom         = 500.0;
static const double scale_x      = 2.0;
static const double scale_y      = 1.0;

static inline double trans_x(double x) {
    return x + getmaxx(stdscr) / 2.0;
}
static inline double trans_y(double y) {
    return y + getmaxy(stdscr) / 2.0;
}

/**
 * Represents a projected point in 2D screen-space.
 */
typedef struct {
    double x, y;
} Point2D;

/** Converts a projected 2D point to an ncurses screen pixel. */
static Pixel point_to_pixel(Point2D p);
/** Applies perspective projection to a 3D point, returning its 2D screen
 * position. */
static Point2D project_point(Point3D p);
/** Rotates a 3D point around the given axis by angle radians. */
static Point3D rotate_point(Point3D p, Axis3D axis, double angle);

Cube *create_cube() {
    Cube *cube = malloc(sizeof(Cube));

    if (!cube) return NULL;

    // clang-format off
    *cube = (Cube){
        .vertices = {
                { -1, -1, -1 },  //     1-------3
                { -1, -1,  1 },  //    /|      /|
                { -1,  1, -1 },  //   / |     / |
                { -1,  1,  1 },  //  5-------7  |
                {  1, -1, -1 },  //  |  0----|--2
                {  1, -1,  1 },  //  | /     | /
                {  1,  1, -1 },  //  |/      |/
                {  1,  1,  1 },  //  4-------6
            },
        .edges = {
                { 0, 1 }, { 0, 2 }, { 0, 4 },
                { 1, 3 }, { 1, 5 },
                { 2, 3 }, { 2, 6 },
                { 3, 7 }, // top line
                { 4, 5 },
                          { 4, 6 },
                { 5, 7 },
                { 6, 7 },
            },
    };
    // clang-format on

    return cube;
}

void destroy_cube(Cube *cube) {
    free(cube);
    endwin();
}

void rotate_cube(Cube *cube, Axis3D axis, double angle) {
    ASSERT_NOT_NULL(cube);

    for (size_t i = 0; i < CUBE_VERTICES; i++) {
        cube->vertices[i] = rotate_point(cube->vertices[i], axis, angle);
    }
}

void draw_cube(const Cube *cube) {
    ASSERT_NOT_NULL(cube);

    for (size_t i = 0; i < CUBE_EDGES; i++) {
        Edge e = cube->edges[i];

        Point2D p1 = project_point(cube->vertices[e.v1]);
        Point2D p2 = project_point(cube->vertices[e.v2]);

        draw_line(point_to_pixel(p1), point_to_pixel(p2));
    }
}

static Pixel point_to_pixel(Point2D p) {
    float x = trans_x(scale_x * p.x);
    float y = trans_y(scale_y * -p.y);

    if (x < 0) x = 0;
    if (y < 0) y = 0;
    if (x >= getmaxx(stdscr)) x = getmaxx(stdscr) - 1;
    if (y >= getmaxy(stdscr)) y = getmaxy(stdscr) - 1;

    return (Pixel){
        .row = y,
        .col = x,
    };
}

static Point2D project_point(Point3D p) {
    double depth = p.z + cam_distance;

    return (Point2D){
        .x = zoom * p.x / depth,
        .y = zoom * p.y / depth,
    };
}

static Point3D rotate_point(Point3D p, Axis3D axis, double angle) {
    switch (axis) {
        case X:
            return (Point3D){
                .x = p.x,
                .y = p.y * cos(angle) - p.z * sin(angle),
                .z = p.y * sin(angle) + p.z * cos(angle),
            };

        case Y:
            return (Point3D){
                .x = p.x * cos(angle) + p.z * sin(angle),
                .y = p.y,
                .z = -p.x * sin(angle) + p.z * cos(angle),
            };

        case Z:
            return (Point3D){
                .x = p.x * cos(angle) - p.y * sin(angle),
                .y = p.x * sin(angle) + p.y * cos(angle),
                .z = p.z,
            };
    }
}
