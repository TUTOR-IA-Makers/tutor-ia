#include <stdio.h>

int main(void) {
    int t, a, b, c, d, e;
    scanf("%d", &t);
    scanf("%d %d %d %d %d", &a, &b, &c, &d, &e);
    printf("%d\n", (a == t) + (b == t) + (c == t) + (d == t) + (e == t));
    return 0;
}
