import 'package:flutter/material.dart';
import 'features/authentication/login_screen.dart';
import 'features/authentication/auth_service.dart';
import 'features/home/home_screen.dart';
import 'package:go_router/go_router.dart';

void main() {
  runApp(const FlutterPOC());
}

// TODO add provider for AuthService
final GoRouter _router = GoRouter(
  initialLocation: '/login',
  routes: [
    GoRoute(
      path: '/',
      builder: (context, state) {
        return const HomeScreen(title: FlutterPOC.title);
      },
    ),
    GoRoute(
      path: '/login',
      builder: (context, state) {
        return const LoginScreen(title: FlutterPOC.title);
      },
    ),
  ],
);

class FlutterPOC extends StatelessWidget {
  static const title = 'Flutter Auth';
  const FlutterPOC({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
        title: title,
        theme: ThemeData(
          colorScheme: ColorScheme.fromSeed(seedColor: Colors.pink),
          useMaterial3: true,
        ),
        routerConfig: _router);
  }
}
