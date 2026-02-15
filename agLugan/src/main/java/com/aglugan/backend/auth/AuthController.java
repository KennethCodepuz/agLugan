package com.aglugan.backend.auth;

import com.aglugan.backend.auth.authDTO.GoogleTokenDTO;
import com.aglugan.backend.auth.authDTO.ResultDTO;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth2")
public class AuthController {


    private final AuthService authService;

    @Autowired
    public AuthController(AuthService authService) {
        this.authService = authService;
    }

// Registration Method
    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody @Valid GoogleTokenDTO token) {

        ResultDTO result = authService.registerUserLogic(token.getIdToken());

        if (!result.isGoogleUserSuccess()) {
            return ResponseEntity.status(401).body(result.getErrorMessage());
        }

        System.out.println("User successfuly registered");

        return ResponseEntity.ok(result.getUser());
    }

//    Login Method 60%
//    TODO: Implement database lookup
    @PostMapping("/login")
    public ResponseEntity<?> loginUser(@RequestBody @Valid GoogleTokenDTO token) {

        ResultDTO result = authService.loginUserLogic(token.getIdToken());

        if (!result.isUserSuccess()) {
            return ResponseEntity.status(401).body(result);
        }

        System.out.println("User successfuly logged in");
        System.out.println(result);

        return ResponseEntity.ok(result.getUser());
    }

}
