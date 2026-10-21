public class RNG {
    public static void main(String[] args) {
        // Inclusive bound preserves the supplied generator's 5,001 symbols.
        for (int i = 0; i <= 5000; i++) {
            int randint = (int) (Math.random() * 4) + 1;
            if (randint == 1) {
                System.out.print("{");
            } else if (randint == 2) {
                System.out.print("}");
            } else if (randint == 3) {
                System.out.print("[");
            } else {
                System.out.print("~");
            }
        }
    }
}
