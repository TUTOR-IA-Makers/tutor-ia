#include <stdio.h>

int main(void) {
    int op, iv;
    scanf("%d %d", &op, &iv);
    double preco = 0.0;
    switch (op) {
        case 1: preco = (iv == 1) ? 500.0 : 900.0; break;
        case 2: preco = (iv == 1) ? 350.0 : 650.0; break;
        case 3: preco = (iv == 1) ? 350.0 : 600.0; break;
        case 4: preco = (iv == 1) ? 300.0 : 550.0; break;
    }
    printf("%.2f\n", preco);
    return 0;
}
