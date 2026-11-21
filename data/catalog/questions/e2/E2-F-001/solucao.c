#include <stdio.h>

int main(void) {
    int b1, h1, b2, h2;
    scanf("%d %d %d %d", &b1, &h1, &b2, &h2);
    int a1 = b1 * h1;
    int a2 = b2 * h2;
    if (a1 > a2) {
        printf("primeiro maior\n");
    } else if (a2 > a1) {
        printf("segundo maior\n");
    } else {
        printf("iguais\n");
    }
    return 0;
}
