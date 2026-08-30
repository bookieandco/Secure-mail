#include "../cgroup_v2.h"
#include <assert.h>
#include <errno.h>

int main(void) {
    errno = 0;
    assert(secure_mail_cgroup_apply("/tmp", "../escape", 1, 1024, 1, 1) == -1);
    assert(errno == EINVAL);
    assert(secure_mail_cgroup_apply(NULL, "secure-mail-native", 1, 1024, 1, 1) == -1);
    assert(secure_mail_cgroup_cleanup("/tmp", "../escape") == -1);
    assert(errno == EINVAL);
    return 0;
}
