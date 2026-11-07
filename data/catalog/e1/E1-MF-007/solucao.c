#include <stdio.h>

int main(void) {
    int h, m, s;
    scanf("%d %d %d", &h, &m, &s);
    printf("%d\n", h * 3600 + m * 60 + s);
    return 0;
}
