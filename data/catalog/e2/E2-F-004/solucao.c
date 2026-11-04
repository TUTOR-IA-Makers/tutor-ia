#include <stdio.h>

int main(void) {
    int n;
    scanf("%d", &n);
    for (int i = 1; i <= n; i++)
        printf("%d\n", 3 * i);
    return 0;
}
