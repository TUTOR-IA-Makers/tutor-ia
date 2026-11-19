#include <stdio.h>

int main(void) {
    int iddP, iddJ;
    scanf("%d %d", &iddP, &iddJ);
    if (iddP > iddJ) {
        printf("Pedro e o mais velho\n");
    } else {
        printf("Joana e a mais velha\n");
    }
    return 0;
}
