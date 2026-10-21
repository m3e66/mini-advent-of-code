// Original generator, with pasted Markdown formatting removed.
public class input {
    public static void main(String[] args) {
        for (int i = 0; i < 10000; i++) {
            String info = "";
            info += (int) (Math.random() * 1000) + 20;
            info += "-";
            info += (int) (Math.random() * 1000) + 20;
            System.out.println(info);
        }
    }
}
