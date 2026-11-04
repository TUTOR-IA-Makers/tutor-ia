#include <stdio.h>

int main(void) {
    int a, b;
    scanf("%d %d", &a, &b);
    if (a % b == 0) printf("divisivel\n");
    else printf("nao divisivel\n");
    return 0;
}
