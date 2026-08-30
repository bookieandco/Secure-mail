#include <stdio.h>

int main(void) {
#if defined(SECURE_MAIL_LINUX)
    fputs("secure-mail-sandbox-helper: enforcement backend not installed\n", stderr);
#else
    fputs("secure-mail-sandbox-helper: unsupported platform\n", stderr);
#endif
    return 78;
}
