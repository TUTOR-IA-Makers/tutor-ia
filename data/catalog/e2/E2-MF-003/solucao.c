#include <stdio.h>

int main(void) {
    int n;
    scanf("%d", &n);
    if (n % 3 == 0) {
        printf("multiplo de 3\n");
    } else {
        printf("nao e multiplo de 3\n");
    }
    return 0;
}
