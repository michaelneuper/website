#include <assert.h>
#include <ctype.h>
#include <stdarg.h>
#include <stdbool.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

/* --- preprocessor directives ---------------------------------------------- */

#define ALPHA_LEN 36
#define ERR_EXIT(msg)                                                          \
	do {                                                                       \
		fprintf(stderr, "%s\n", (msg));                                        \
		exit(EXIT_FAILURE);                                                    \
	} while (0)

/* --- types ---------------------------------------------------------------- */

typedef struct {
	int  index;
	char key;
} KbKey;

typedef struct {
	const char  key;
	const char *kcode;
	const bool  shift;
} Key;

/* --- global variables ----------------------------------------------------- */

/** output file: `~/.config/layer.json` */
FILE *outp;

// TODO read keyboard from config file
const char *keyboard =
    ",---,---,---,---,---,---,---,---,---,---,---,---,---,-------,\n"
    "|   | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 0 |   |   |       |\n"
    "|---'-,-'-,-'-,-'-,-'-,-'-,-'-,-'-,-'-,-'-,-'-,-'-,-'-,-----|\n"
    "|     | q | w | e | r | t | y | u | i | o | p |   |   |     |\n"
    "|-----',--',--',--',--',--',--',--',--',--',--',--',--'-----|\n"
    "|      | a | s | d | f | g | h | j | k | l |   |   |        |\n"
    "|------'-,-'-,-'-,-'-+-'-,-'-,-'-+-'-,-'-,-'-,-'-,-'------,-'\n"
    "|        | z | x | c | v | b | n | m |   |   |   |        |\n"
    "|---,----',--'--,'---'---'---'---'---',--'--,'---'------,-'\n"
    "|   |     |     |                     |     |    |      |\n"
    "'---'-----'-----'---------------------'-----'----'------'\n";

/** index of each key in keyboard */
KbKey indices[ALPHA_LEN];

/** karabiner key codes sorted in lexicographic order */
// TODO add custom field for length
const Key keys[] = {
    {'!', "1", true},
    {'"', "quote", true},
    {'#', "3", true},
    {'$', "4", true},
    {'%', "5", true},
    {'&', "7", true},
    {'(', "9", true},
    {')', "0", true},
    {'*', "8", true},
    {'+', "equal_sign", true},
    {',', "comma", false},
    {'-', "hyphen", false},
    {'.', "period", false},
    {'/', "slash", false},
    {':', "semicolon", true},
    {';', "semicolon", false},
    {'<', "comma", true},
    {'=', "equal_sign", false},
    {'>', "period", true},
    {'?', "slash", true},
    {'@', "2", true},
    {'[', "open_bracket", false},
    {'\'', "quote", false},
    {'\\', "backslash", false},
    {']', "close_bracket", false},
    {'^', "6", true},
    {'_', "hyphen", true},
    {'`', "grave_accent_and_tilde", false},
    {'{', "open_bracket", true},
    {'|', "backslash", true},
    {'}', "close_bracket", true},
    {'~', "grave_accent_and_tilde", true},
};

/* --- function prototypes -------------------------------------------------- */

/**
 * Writes the karabiner rules to a buffer.
 *
 * @param keycode the key code of the key that activates the symbol layer
 */
void write_krules(const char *keycode);

/**
 * Writes the karabiner rule for an individual key.
 *
 * @param from the key that gets remapped, e.g., 'f'
 * @param to the key that `from` should be remapped to
 */
void write_krule(const char from, const Key *to);

/**
 * Writes the karabiner rule for toggling the layer.
 *
 * @param keycode the key code of the key that activates the symbol layer
 */
void write_ktoggle(const char *keycode);

/** builds the indices array */
void build_key_indices();

/** print json to file */
void print_json(const char *, ...);

/** compares two key codes */
int keycmp(const void *, const void *);

/* --- main routine --------------------------------------------------------- */

int main(int argc, char **argv)
{
	if (argc != 2) {
		ERR_EXIT("Usage: `layerkey <keycode>`\n"
		         "where `<keycode>` is the keycode of the key that should "
		         "activate the layer.");
	}

	// TODO handle error
	outp = fopen("layer.json", "w");

	build_key_indices();

	write_krules(argv[1]);

	return EXIT_SUCCESS;
}

/* --- helper routines ------------------------------------------------------ */

void write_krules(const char *keycode)
{
	FILE *configp;

	print_json("{\n"
	           "    \"description\": \"Symbol Layer\",\n"
	           "    \"manipulators\": [\n");

	write_ktoggle(keycode);

	// see
	// <https://developer.apple.com/library/archive/documentation/CoreFoundation/Conceptual/CFPreferences/Tasks/UsingHighAPI.html>
	configp = fopen("config", "r");

	if (!configp) {
		fprintf(stderr, "Unable to open config file.");
		goto error;
	}

	for (size_t i = 0; i < ALPHA_LEN; ++i) {
		// TODO handle errors
		fseek(configp, indices[i].index, SEEK_SET);
		int ch = fgetc(configp);

		assert(isprint(ch));

		// only create an entry if the key was changed
		if (ch != indices[i].key) {
			// FIXME magic number
			// TODO handle errors
			Key *key = bsearch(&ch, keys, 31, sizeof(Key), keycmp);

			write_krule(indices[i].key, key);
		}
	}

	// TODO remove final trailing comma
	print_json("    ]\n"
	           "}\n");

	fclose(configp);
	return;

error:
	if (configp) fclose(configp);
	exit(1);
}

void write_krule(const char from, const Key *to)
{
	const char *json =
	    "        {\n"
	    "            \"conditions\": [\n"
	    "                {\n"
	    "                    \"name\": \"layer\",\n"
	    "                    \"type\": \"variable_if\",\n"
	    "                    \"value\": 0\n"
	    "                }\n"
	    "            ],\n"
	    "            \"from\": {\n"
	    "                \"key_code\": \"%c\",\n" // from->key
	    "                \"modifiers\": {\n"
	    "                    \"optional\": [\n"
	    "                        \"shift\",\n"
	    "                        \"command\",\n"
	    "                        \"control\",\n"
	    "                        \"option\",\n"
	    "                        \"fn\"\n"
	    "                    ]\n"
	    "                }\n"
	    "            },\n"
	    "            },\n"
	    "            \"to\": [\n"
	    "                {\n"
	    "                    \"key_code\": \"%s\",\n" // to->kcode
	    "                    %s\n"                    // to->shift (modifier)
	    "                }\n"
	    "            ],\n"
	    "            \"type\": \"basic\"\n"
	    "        },\n";

	const char *modifier = to->shift
	                           ? "\"modifiers\": [\"shift\"]"
	                           // FIXME remove trailing comma
	                           : "\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b";

	print_json(json, from, to->kcode, modifier);
}

void write_ktoggle(const char *keycode)
{
	print_json(
	    "        {\n"
	    "            \"conditions\": [\n"
	    "                {\n"
	    "                    \"identifiers\": [\n"
	    "                        {\n"
	    "                            \"description\": \"Built-in keyboard\",\n"
	    "                            \"is_built_in_keyboard\": true\n"
	    "                        }\n"
	    "                    ],\n"
	    "                    \"type\": \"device_if\"\n"
	    "                },\n"
	    "                {\n"
	    "                    \"name\": \"layer\",\n"
	    "                    \"type\": \"variable_if\",\n"
	    "                    \"value\": 0\n"
	    "                }\n"
	    "            ],\n"
	    "            \"from\": {\n"
	    "                \"key_code\": \"%s\",\n" // toggle key
	    "                \"modifiers\": {\n"
	    "                    \"optional\": [\n"
	    "                        \"shift\",\n"
	    "                        \"command\",\n"
	    "                        \"control\",\n"
	    "                        \"option\",\n"
	    "                        \"fn\"\n"
	    "                    ]\n"
	    "                }\n"
	    "            },\n"
	    "            \"to\": [\n"
	    "                {\n"
	    "                    \"set_variable\": {\n"
	    "                        \"name\": \"layer\",\n"
	    "                        \"value\": 1\n"
	    "                    }\n"
	    "                }\n"
	    "            ],\n"
	    "            \"to_after_key_up\": [\n"
	    "                {\n"
	    "                    \"set_variable\": {\n"
	    "                        \"name\": \"layer\",\n"
	    "                        \"value\": 0\n"
	    "                    }\n"
	    "                }\n"
	    "            ],\n"
	    "            \"type\": \"basic\"\n"
	    "        },\n",
	    keycode);
}

void build_key_indices()
{
	const size_t kblen = strlen(keyboard);
	size_t       k = ALPHA_LEN;

	// TODO skip whitespace
	for (size_t i = 0; i < kblen; ++i) {
		if (!isalnum(keyboard[i])) continue;

		indices[ALPHA_LEN - (k--)] = (KbKey){
		    .index = i,
		    .key = keyboard[i],
		};
	}

#ifdef DEBUG
	printf("key\tindex\n");
	for (int i = 0; i < ALPHA_LEN; ++i) {
		printf("%d\t%c\n", indices[i].index, indices[i].key);
	}
#endif
}

void print_json(const char *fmt, ...)
{
	va_list args;
	va_start(args, fmt);
	vfprintf(outp, fmt, args);
	va_end(args);
}

int keycmp(const void *keycode1p, const void *keycode2p)
{
	const int key1 = ((Key *)keycode1p)->key;
	const int key2 = ((Key *)keycode2p)->key;

	return (key1 < key2) ? -1 : (key1 > key2);
}
