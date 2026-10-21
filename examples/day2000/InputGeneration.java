import java.util.Random;
import java.util.StringJoiner;

public class InputGeneration {
    public static void main(String[] args) {
        Random random = args.length == 0 ? new Random() : new Random(Long.parseLong(args[0]));
        int trials = 114 + random.nextInt(10);
        for (int trial = 0; trial < trials; trial++) {
            int height = 3 + random.nextInt(5);
            int width = 3 + random.nextInt(5);
            int startX = -12 + random.nextInt(26 - width);
            int startY = -12 + random.nextInt(26 - height);
            int label = 1 + random.nextInt(999);
            int count = 0;
            StringJoiner coordinates = new StringJoiner(",");
            for (int y = 0; y < height; y++) {
                for (int x = 0; x < width; x++) {
                    double probability = count > (height * width) / 3 ? 0.2 : 0.8;
                    if (random.nextDouble() >= probability) break;
                    coordinates.add("(" + (startX + x) + "," + (startY + y) + ")");
                    count++;
                }
            }
            System.out.println("{" + label + ":" + coordinates + "}");
        }
    }
}
