public class Tree {
    public static void main(String[] args) {
        int numTrees = (int) (Math.random() * 151) + 50;
        for (int i = 0; i < numTrees; i++) {
            // This is a width limit. The loop prints 5–10 actual rows.
            int treeHeight = (int) (Math.random() * 11) + 10;
            for (int j = 1; j < treeHeight; j += 2) {
                for (int k = 0; k < (treeHeight - j) / 2; k++) {
                    System.out.print(" ");
                }
                for (int l = 0; l < j; l++) {
                    if (j == 1) {
                        System.out.print("*");
                        continue;
                    }
                    int ornamentChance = (int) (Math.random() * 2);
                    if (ornamentChance == 1) {
                        System.out.print("*");
                    } else if ((int) (Math.random() * 2) == 1) {
                        System.out.print("@");
                    } else {
                        System.out.print("o");
                    }
                }
                System.out.println();
            }
            System.out.println();
        }
    }
}
