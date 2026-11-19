#include <stdio.h>

int main(void) {
    int num, c;
    scanf("%d", &num);
    c = num / 100;
    if (c % 2 == 0) {
        printf("par\n");
    } else {
        printf("impar\n");
    }
    return 0;
}
