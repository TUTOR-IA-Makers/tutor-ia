#include <stdio.h>

int main(void) {
    int mes;
    scanf("%d", &mes);
    int dias;
    switch (mes) {
        case 2: dias = 28; break;
        case 4: case 6: case 9: case 11: dias = 30; break;
        default: dias = 31;
    }
    printf("%d\n", dias);
    return 0;
}
