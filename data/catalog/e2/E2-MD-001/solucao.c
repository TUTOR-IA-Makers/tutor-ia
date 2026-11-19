#include <stdio.h>

int main(void) {
    for (int i = 11; i < 100; i++) {
        int resto = i % 10;
        int quoc = i / 10;
        if (resto != 0 && i % quoc == 0) {
            printf("%d\n", i);
        }
    }
    return 0;
}
