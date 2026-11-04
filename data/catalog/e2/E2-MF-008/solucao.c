#include <stdio.h>

int main(void) {
    char c;
    scanf(" %c", &c);
    if (c=='A'||c=='E'||c=='I'||c=='O'||c=='U')
        printf("vogal\n");
    else
        printf("consoante\n");
    return 0;
}
