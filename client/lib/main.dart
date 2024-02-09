import 'package:flutter/material.dart';
import 'features/authentication/login_screen.dart';

void main() {
  runApp(const FlutterPOC());
}

class FlutterPOC extends StatelessWidget {
  static const title = 'Flutter Auth';
  const FlutterPOC({super.key});

  // This widget is the root of your application
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
        title: title,
        theme: ThemeData(
          colorScheme: ColorScheme.fromSeed(seedColor: Colors.pink),
          useMaterial3: true,
        ),
        home: const LoginScreen(
          title: title,
        ));
  }
}
