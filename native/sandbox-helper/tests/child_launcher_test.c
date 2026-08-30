#include "../child_launcher.h"
#include <assert.h>
#include <errno.h>

int main(void) {
    char *const argv[] = { "/bin/true", NULL };
    errno = 0;
    assert(secure_mail_spawn_restricted(NULL, "/bin/true", argv, "/tmp", 1024, 1, 1) == -1);
    assert(errno == EINVAL);
    return 0;
}
