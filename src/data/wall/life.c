#include <ncurses.h>
#include <stdlib.h>
#include <time.h>
#include <unistd.h>

#define CURS_COL   1
#define SLEEP_MSEC 225

/* --- type definitions ----------------------------------------------------- */

typedef enum {
    DEAD  = 0,
    ALIVE = 1,
} State;

typedef struct {
    size_t  rows, cols;
    State **cells;
} Grid;

/* --- helper macros -------------------------------------------------------- */

#define MSEC_TO_NSEC(nsec) ((nsec) * 1000000)
#define TOGGLE(a)          ((a) = !(a))
#define MIN(a, b)          ((a) < (b) ? (a) : (b))
#define MAX(a, b)          ((a) > (b) ? (a) : (b))

/* --- function prototypes: game logic -------------------------------------- */

void   game_loop();
void   tick(const Grid *cur, Grid *next);
size_t count_neighbours(const Grid *grid, size_t row, size_t col);

/* --- function prototypes: drawing ----------------------------------------- */

void init_screen(void);
void cleanup(void);
void print_char(size_t row, size_t col, char ch, int color_pair);

/* --- function prototypes: grid -------------------------------------------- */

Grid *init_grid(size_t rows, size_t cols);
void  free_grid(Grid *grid);
void  print_grid(const Grid *grid);
void  set_grid(Grid *grid);
void  randomize_grid(Grid *grid);

/* --- main routine --------------------------------------------------------- */

int main(void) {
    init_screen();
    game_loop();
    cleanup();

    return EXIT_SUCCESS;
}

/* -------------------------------------------------------------------------- */

void game_loop() {
    int    key;
    bool   paused = false;
    size_t rows   = getmaxy(stdscr) + 1;
    size_t cols   = getmaxx(stdscr) + 1;
    Grid  *cur    = init_grid(rows, cols);
    Grid  *next   = init_grid(rows, cols);

    if (!(cur && next)) {
        cleanup();
        if (cur) free_grid(cur);
        if (next) free_grid(next);
        fprintf(stderr, "Something terrible has happened.\n");
        exit(1);
    }

    struct timespec ts;
    ts.tv_sec  = 0;
    ts.tv_nsec = MSEC_TO_NSEC(SLEEP_MSEC);

    set_grid(cur);

    while ((key = getch()) != 'q') {
        if (key == 'e') {
            paused = true;
            set_grid(cur);
            print_grid(cur);
        }

        if (key == ' ' || key == 'p') TOGGLE(paused);
        if (key == '-' || key == '_') ts.tv_nsec *= 2; // decrease tick speed
        if (key == '+' || key == '=') ts.tv_nsec /= 2; // increase tick speed

        if (paused && key != 'n') continue;

        tick(cur, next);

        // swap the current grid with the next
        Grid *temp = cur;
        cur        = next;
        next       = temp;

        print_grid(cur);

        if (!paused) nanosleep(&ts, NULL);
    }

    free_grid(cur);
    free_grid(next);
}

void tick(const Grid *cur, Grid *next) {
    for (size_t i = 0; i < cur->rows; i++) {
        for (size_t j = 0; j < cur->cols; j++) {
            size_t n = count_neighbours(cur, i, j);

            if (cur->cells[i][j]) { // live cell
                if (n < 2 || n > 3) {
                    next->cells[i][j] = DEAD;
                } else {
                    next->cells[i][j] = ALIVE;
                }
            } else { // dead cell
                if (n == 3) {
                    next->cells[i][j] = ALIVE;
                } else {
                    next->cells[i][j] = DEAD;
                }
            }
        }
    }
}

size_t count_neighbours(const Grid *grid, size_t row, size_t col) {
    size_t count = 0;

    for (size_t i = MAX(0, row - 1); i < MIN(row + 1, grid->rows - 1) + 1;
         i++) {
        for (size_t j = MAX(0, col - 1); j < MIN(col + 1, grid->cols - 1) + 1;
             j++) {
            count += grid->cells[i][j];
        }
    }

    return count - grid->cells[row][col];
}

void init_screen(void) {
    initscr();
    noecho();
    start_color();
    cbreak();              // disable line buffering
    curs_set(0);           // invisible cursor
    nodelay(stdscr, TRUE); // make `getch()` non-blocking
    keypad(stdscr, TRUE);

    attron(A_BOLD);
}

void cleanup(void) {
    attroff(A_BOLD);
    endwin();
}

void print_char(size_t row, size_t col, char ch, int color_pair) {
    attron(COLOR_PAIR(color_pair));
    mvprintw(row, col, "%c", ch);
    attroff(COLOR_PAIR(color_pair));
}

Grid *init_grid(size_t rows, size_t cols) {
    State **cells = malloc(rows * sizeof(State *));
    Grid   *grid  = malloc(sizeof(Grid));

    if (!(grid && cells)) {
        if (cells) free(cells);
        if (grid) free(grid);

        return NULL;
    }

    for (size_t i = 0; i < rows; i++) {
        cells[i] = malloc(cols * sizeof(State));

        if (!cells[i]) {
            for (size_t j = 0; j < i; j++)
                free(cells[i]);
            free(cells);
            free(grid);

            return NULL;
        }

        // initialize all cells to DEAD
        for (size_t j = 0; j < cols; j++) {
            cells[i][j] = DEAD;
        }
    }

    grid->cells = cells;
    grid->rows  = rows;
    grid->cols  = cols;

    return grid;
}

void free_grid(Grid *grid) {
    for (size_t i = 0; i < grid->rows; i++) {
        free(grid->cells[i]);
    }

    free(grid->cells);
    free(grid);
}

void print_grid(const Grid *grid) {
    for (size_t i = 0; i < grid->rows; i++) {
        for (size_t j = 0; j < grid->cols; j++) {
            // print ' ' for dead cells to avoid having to clear the screen
            print_char(i, j, grid->cells[i][j] ? '#' : ' ', 0);
        }
    }

    refresh();
}

void set_grid(Grid *grid) {
    bool paused = true;

    struct {
        size_t row, col;
    } curs = {grid->rows / 2, grid->cols / 2};

    init_pair(CURS_COL, COLOR_BLUE, COLOR_BLACK);
    print_char(curs.row, curs.col, '*', CURS_COL);

    while (paused) {
        int key = getch();

        switch (key) {
            case KEY_UP:
            case 'k':
            case 'w':
                curs.row--;
                break;

            case KEY_LEFT:
            case 'h':
            case 'a':
                curs.col--;
                break;

            case KEY_DOWN:
            case 'j':
            case 's':
                curs.row++;
                break;

            case KEY_RIGHT:
            case 'l':
            case 'd':
                curs.col++;
                break;

            case 't':
                TOGGLE(grid->cells[curs.row][curs.col]);
                break;

            case 'r':
                randomize_grid(grid);
                break;

            case 'q':
                free_grid(grid);
                cleanup();
                exit(0);

            case '\n':
            case '\r':
            case ' ':
            case 'e':
                paused = false;

            default:
                continue;
        }

        // wrap cursor around screen
        curs.row = (curs.row + grid->rows) % grid->rows;
        curs.col = (curs.col + grid->cols) % grid->cols;

        // re-render the screen
        print_grid(grid);
        print_char(curs.row, curs.col, '*', CURS_COL);
    }
}

void randomize_grid(Grid *grid) {
    for (size_t i = 0; i < grid->rows; i++) {
        for (size_t j = 0; j < grid->cols; j++) {
            double rnd = (double)rand() / RAND_MAX;

            grid->cells[i][j] = rnd > 0.8 ? ALIVE : DEAD;
        }
    }
}
